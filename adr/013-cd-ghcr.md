# ADR 013: CD GHCR (M16)

## Statut

Accepté: M16

## Contexte

M11-M15 : image prod buildable localement et validée en CI (`docker-prod-build`), mais aucun artefact registry: deploy staging = rebuild local ≠ ce qui a passé la CI sur `main`.

## Décision

1. Workflow **`.github/workflows/cd.yml`** séparé de la CI.
2. **GHCR** `ghcr.io/<owner>/incident-coordination-engine` via `GITHUB_TOKEN` (`packages: write`).
3. Déclencheurs :
   - `workflow_run` après **CI success** sur `main` → tags `:main`, `:sha-*` ;
   - push tag **`v*.*.*`** → tags semver + `:latest` ;
   - `workflow_dispatch` manuel.
4. **`compose.staging.yaml`**: pull image GHCR, pas de `build:` ; secrets via `.env.staging`.
5. Make : `pull-staging`, `up-staging`, `down-staging`.
6. Doc [`docs/CD.md`](../docs/CD.md).
7. Migrations staging via job CD optionnel (ADR 014), pas dans l'image runtime.

## Conséquences

- CI conserve `docker-prod-build` **sans push** (PRs incluses).
- Tag semver ne relance pas la CI complète: CD build l'image sur tag (acceptable portfolio).
- Package GHCR public recommandé pour démo pull sans PAT.

## Alternatives rejetées

- Push GHCR dans le job CI existant: mélange responsabilités ; push sur PR à risque.
- Docker Hub: GHCR intégré GitHub, zero secret supplémentaire pour Actions.
- Deploy auto staging (SSH/K8s): hors scope M16 ; deploy manuel documenté.
