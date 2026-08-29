# Incident Coordination Engine — bootstrap (M9)
# Usage: make help

.DEFAULT_GOAL := help

PORT ?= 3001
NODE ?= node
NPM ?= npm
COMPOSE ?= docker compose

.PHONY: help setup dev test build lint check db-up db-down db-reset clean-env wait-db migrate seed deps env check-deps

help: ## Affiche les cibles disponibles
	@echo "Incident Coordination Engine — Make (M10)"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Host natif (M9)  : make setup && make dev → http://localhost:$(PORT)"

setup: check-deps env deps db-up wait-db migrate seed ## Bootstrap host : deps + Postgres seul + migrate + seed
	@echo ""
	@echo "✓ Setup terminé — lancez : make dev"
	@echo "  Comptes démo : lead@demo.local / demo123 (local uniquement)"

dev: check-deps env ## Next.js sur la machine hôte (PORT=3001)
	$(NPM) run dev -- -p $(PORT)

test: check-deps env ## Tests Vitest (hôte)
	$(NPM) test

build: check-deps env ## Build production (hôte)
	$(NPM) run build

lint: check-deps ## ESLint
	$(NPM) run lint

check: test build ## CI locale minimale : test + build

db-up: check-docker ## Postgres seul (pour make setup / dev hôte)
	$(COMPOSE) up -d postgres

db-down: check-docker ## Alias : arrête toute la stack
	$(COMPOSE) down

db-reset: check-docker env ## Reset DB (migrate reset + seed, hôte)
	$(NPM) run db:reset

wait-db: check-docker ## Attend Postgres (service compose)
	@./scripts/wait-for-postgres.sh

migrate: env ## prisma migrate deploy (hôte)
	$(NPM) run db:migrate:deploy

seed: env ## Seed démo (hôte)
	$(NPM) run db:seed

deps: check-node ## npm ci
	@if [ -f package-lock.json ]; then $(NPM) ci; else $(NPM) install; fi

env: ## Crée .env depuis .env.example si absent
	@./scripts/ensure-env.sh

clean-env: ## Supprime .env local
	@rm -f .env && echo ".env supprimé"

check-deps: check-node check-docker check-make ## Vérifie Node, Docker, Make
	@echo "✓ Prérequis OK (Node, Docker, Make)"

check-node:
	@command -v $(NODE) >/dev/null 2>&1 || { echo "✗ Node.js requis (>= 20)"; exit 1; }
	@$(NODE) -e "const v=process.versions.node.split('.').map(Number); if(v[0]<20){console.error('✗ Node >= 20 requis'); process.exit(1)}"

check-docker:
	@command -v docker >/dev/null 2>&1 || { echo "✗ Docker requis"; exit 1; }
	@$(COMPOSE) version >/dev/null 2>&1 || { echo "✗ Docker Compose v2 requis"; exit 1; }

check-make:
	@command -v make >/dev/null 2>&1 || { echo "✗ Make requis"; exit 1; }

up: check-docker env ## docker compose up -d --build (web + Postgres)
	$(COMPOSE) up --build -d
	@echo ""
	@echo "✓ Stack Compose démarrée — http://localhost:3001"

down: check-docker ## Arrête web + Postgres
	$(COMPOSE) down

logs: check-docker ## Suit les logs web + postgres
	$(COMPOSE) logs -f web postgres

compose: check-docker env ## docker compose up --build (premier plan)
	$(COMPOSE) up --build
