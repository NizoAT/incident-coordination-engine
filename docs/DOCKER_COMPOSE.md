# Docker Compose — dev stack (M10)

Environnement **web + Postgres** reproductible via un seul fichier `compose.yaml`.

## Démarrage rapide

```bash
# Prérequis : Docker Compose v2 uniquement (pas de Node local requis pour l'app)
docker compose up --build
# ou
make up          # detached
make compose     # premier plan (logs)
```

Application : **http://localhost:8080** (via Nginx — M12)

Comptes démo (seed auto si DB vide) — **local uniquement** :

| Email | Mot de passe |
| ----- | ------------ |
| `lead@demo.local` | `demo123` |
| `responder@demo.local` | `demo123` |

## Services

| Service | Rôle | Port hôte |
| ------- | ---- | --------- |
| `nginx` | Reverse proxy (entrée publique) | 8080 |
| `web` | Next.js dev (réseau interne) | — |
| `postgres` | Postgres 16 | 5433 |

Réseau interne Compose : le service `web` utilise `DATABASE_URL=...@postgres:5432/...`  
Développement **hôte natif** (`make dev`) : `.env` avec `localhost:5433`.

## Cycle de vie

```bash
make up          # build + démarrage detached
make logs        # logs nginx + web + postgres
make down        # arrêt + suppression conteneurs (volumes conservés)
docker compose down -v   # ⚠ supprime aussi les volumes Postgres
```

Au démarrage du conteneur `web` :

1. Attente santé Postgres
2. `prisma migrate deploy`
3. `scripts/seed-if-empty.ts` (seed uniquement si aucun utilisateur)

## Fichiers

| Fichier | Description |
| ------- | ----------- |
| `compose.yaml` | Stack dev web + db |
| `Dockerfile.dev` | Image dev (M10) — **pas** l'image prod (M11) |
| `docker/entrypoint.dev.sh` | Migrate + seed conditionnel |
| `.dockerignore` | Contexte build allégé |

## Deux modes de dev

| Mode | Commande | Quand |
| ---- | -------- | ----- |
| **Compose** | `make up` | Machine sans Node, parité conteneur, onboarding minimal |
| **Hôte** | `make setup && make dev` | Iteration rapide, tests locaux, debugging IDE |

Les tests (`make test`) restent exécutés **sur l'hôte** (Vitest + accès DB via port 5433).

## Dépannage

```bash
docker compose ps
docker compose logs web
docker compose build --no-cache web
```

Port 3001 occupé : `PORT=4000 docker compose up --build`

Rebuild node_modules volume :

```bash
docker compose down
docker volume rm incident-coordination-engine_ice_node_modules
make up
```

## Prochaine étape

**M11** — Dockerfile multi-stage production, utilisateur non-root, scan Trivy.
