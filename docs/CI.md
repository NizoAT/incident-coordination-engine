# CI GitHub Actions (M13)

Pipeline : **lint → typecheck → test → build** (+ build image Docker prod).

Badge (après push sur GitHub) :

```markdown
[![CI](https://github.com/NizoAT/incident-coordination-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/NizoAT/incident-coordination-engine/actions/workflows/ci.yml)
```

## Workflow

Fichier : [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

| Job | Contenu |
| --- | ------- |
| `lint-typecheck-test-build` | Postgres service → migrate → seed → lint → tsc → vitest → next build |
| `e2e` | Postgres → migrate → seed → build → Playwright (2 parcours critiques) |
| `docker-prod-build` | Build `Dockerfile` (cache GHA) après succès du job principal |

Déclencheurs : `push` et `pull_request` sur `main`.

## Variables CI

Secrets **non requis**: placeholders explicites dans le workflow :

```yaml
SESSION_SECRET: ci-only-not-for-production-use-32chars!!
GITHUB_WEBHOOK_SECRET: ci-webhook-secret-for-tests-only-change-me
DATABASE_URL: postgresql://ice:ice@localhost:5432/...
```

Les tests d'intégration (Prisma) nécessitent **Postgres + seed** avant `npm test`.

## Reproduire localement

```bash
make ci          # lint + typecheck + test + build (Postgres local requis pour tests)
# ou
npm run ci       # idem
```

Avec Postgres Compose :

```bash
make db-up && make wait-db && make migrate && make seed && npm run ci
```

## Protection de branche `main` (GitHub)

À configurer manuellement après le premier push du workflow :

1. **Settings → Branches → Add branch protection rule**
2. Branch name pattern : `main`
3. Cocher :
   - **Require a pull request before merging** (recommandé)
   - **Require status checks to pass before merging**
   - Status checks : `lint-typecheck-test-build`, `Playwright E2E`, `docker-prod-build`
   - **Require branches to be up to date before merging**
4. (Optionnel) **Do not allow bypassing the above settings**

Sans accès admin au repo, documenter cette config dans le README portfolio.

## CD (M16)

Workflow séparé : [`.github/workflows/cd.yml`](../.github/workflows/cd.yml)

- Push GHCR après **CI success** sur `main` (`:main`, `:sha-*`)
- Push tag `v*.*.*` → tags semver + `:latest`
- CI ne pousse **pas** l'image (job `docker-prod-build` = build only)

Doc deploy staging : [`docs/CD.md`](CD.md)

## Prochaine étape

**M17**: API contract OpenAPI.
