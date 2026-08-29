# ADR 007 — Docker Compose dev web + db (M10)

## Statut

Accepté — M10

## Contexte

M9 bootstrap via Make + Postgres Compose couvrait le dev **hôte natif**. M10 exige `docker compose up` avec **web + db** pour reproductibilité inter-machines sans installer Node.

## Décision

1. **`compose.yaml`** (spec) remplace `docker-compose.yml` — services `postgres` + `web`.
2. **`Dockerfile.dev`** séparé de l'image prod (M11) — hot reload, volume mount, `WATCHPACK_POLLING`.
3. **`DATABASE_URL` injectée par Compose** pour `web` (`postgres:5432`) — `.env` hôte reste `localhost:5433`.
4. Entrypoint : migrate deploy + **seed-if-empty** (pas de reset à chaque restart).
5. Volume nommé `ice_node_modules` pour perf bind-mount.
6. `make up` / `make compose` + doc `docs/DOCKER_COMPOSE.md`.

## Conséquences

- Deux chemins dev documentés : Compose vs hôte (M9).
- Tests Vitest restent sur hôte (hors scope conteneur test M10).
- M11 ajoutera `Dockerfile` prod sans remplacer `Dockerfile.dev`.

## Alternatives rejetées

- `next start` en conteneur dev — pas de hot reload.
- `env_file: .env` sur web — risque d'écraser `DATABASE_URL` avec localhost.
