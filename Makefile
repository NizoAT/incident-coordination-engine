# Incident Coordination Engine — bootstrap + Compose (M9–M10)
# Usage: make help

.DEFAULT_GOAL := help

PORT ?= 3001
NGINX_PORT ?= 8080
IMAGE_PROD ?= incident-coordination-engine:prod
IMAGE_GHCR ?= ghcr.io/nizoat/incident-coordination-engine:main
STAGING_ENV ?= .env.staging
NODE ?= node
NPM ?= npm
COMPOSE ?= docker compose

.PHONY: help setup dev test test-e2e build lint typecheck ci check up down logs compose db-up db-down db-reset clean-env \
        docker-build-prod docker-size docker-scan up-prod down-prod pull-staging up-staging down-staging

help: ## Affiche les cibles disponibles
	@echo "Incident Coordination Engine — Make (M16)"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Compose + Nginx  : make up      → http://localhost:$(NGINX_PORT)"
	@echo "Prod Compose     : make up-prod    → http://localhost:$(NGINX_PORT)"
	@echo "Staging GHCR     : make up-staging → http://localhost:$(NGINX_PORT)"
	@echo "Host natif (M9)  : make setup && make dev → http://localhost:$(PORT)"

setup: check-deps env deps db-up wait-db migrate seed ## Bootstrap host : deps + Postgres seul + migrate + seed
	@echo ""
	@echo "✓ Setup terminé — lancez : make dev"
	@echo "  Comptes démo : lead@demo.local / demo123 (local uniquement)"

dev: check-deps env ## Next.js sur la machine hôte (PORT=3001)
	$(NPM) run dev -- -p $(PORT)

up: check-docker env ## docker compose up -d --build (nginx + web + Postgres)
	$(COMPOSE) up --build -d
	@echo ""
	@echo "✓ Stack Compose démarrée — http://localhost:$(NGINX_PORT) (Nginx)"
	@echo "  Logs : make logs"

compose: check-docker env ## docker compose up --build (premier plan)
	$(COMPOSE) up --build

down: check-docker ## Arrête nginx + web + Postgres
	$(COMPOSE) down

logs: check-docker ## Suit les logs nginx + web + postgres
	$(COMPOSE) logs -f nginx web postgres

test: check-deps env ## Tests Vitest (hôte)
	$(NPM) test

test-e2e: check-deps env migrate seed build ## Playwright E2E (M14)
	PORT=3099 PLAYWRIGHT_USE_START=1 $(NPM) run test:e2e

build: check-deps env ## Build production (hôte)
	$(NPM) run build

lint: check-deps ## ESLint
	$(NPM) run lint

typecheck: check-deps ## TypeScript (tsc --noEmit)
	$(NPM) run typecheck

ci: check-deps env migrate seed lint typecheck test build ## Pipeline CI local (M13)
	@echo "✓ CI locale OK"

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

docker-build-prod: check-docker ## Build image production multi-stage
	docker build -t $(IMAGE_PROD) -f Dockerfile .

docker-size: check-docker ## Affiche la taille de l'image prod
	@docker image inspect $(IMAGE_PROD) --format='{{.Size}}' 2>/dev/null | awk '{printf "Image %s : %.0f MB\n", "$(IMAGE_PROD)", $$1/1024/1024}' \
	  || { echo "Image $(IMAGE_PROD) absente — lancez make docker-build-prod"; exit 1; }

docker-scan: check-docker ## Scan Trivy (CRITICAL/HIGH doivent être 0)
	@command -v trivy >/dev/null 2>&1 || { echo "✗ trivy requis — https://aquasecurity.github.io/trivy/"; exit 1; }
	@docker image inspect $(IMAGE_PROD) >/dev/null 2>&1 || $(MAKE) docker-build-prod
	trivy image --severity CRITICAL,HIGH --exit-code 1 $(IMAGE_PROD)

up-prod: check-docker env ## Compose prod + Nginx
	$(COMPOSE) -f compose.prod.yaml up --build -d
	@echo ""
	@echo "✓ Stack prod démarrée — http://localhost:$(NGINX_PORT) (Nginx)"
	@echo "  Seed manuel si besoin : npm run db:seed (DATABASE_URL localhost:5433)"

down-prod: check-docker ## Arrête stack prod
	$(COMPOSE) -f compose.prod.yaml down

pull-staging: check-docker ## Pull image GHCR (M16)
	docker pull $(IMAGE_GHCR)

up-staging: check-docker ## Compose staging (image GHCR, pas de build)
	@if [ ! -f "$(STAGING_ENV)" ]; then \
	  echo "✗ $(STAGING_ENV) absent — cp .env.staging.example .env.staging"; \
	  exit 1; \
	fi
	ICE_IMAGE=$(IMAGE_GHCR) $(COMPOSE) -f compose.staging.yaml --env-file $(STAGING_ENV) pull web
	ICE_IMAGE=$(IMAGE_GHCR) $(COMPOSE) -f compose.staging.yaml --env-file $(STAGING_ENV) up -d
	@echo ""
	@echo "✓ Staging GHCR démarré — http://localhost:$(NGINX_PORT)"
	@echo "  Image : $(IMAGE_GHCR)"
	@echo "  Health : curl -s http://localhost:$(NGINX_PORT)/api/health | jq ."

down-staging: check-docker ## Arrête stack staging
	@if [ -f "$(STAGING_ENV)" ]; then \
	  ICE_IMAGE=$(IMAGE_GHCR) $(COMPOSE) -f compose.staging.yaml --env-file $(STAGING_ENV) down; \
	else \
	  $(COMPOSE) -f compose.staging.yaml down; \
	fi
