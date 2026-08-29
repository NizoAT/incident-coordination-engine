# Tests E2E Playwright (M14)

Parcours critiques couverts par Playwright: complément des tests Vitest (logique métier / Prisma).

## Parcours

| Spec | Scénario |
| ---- | -------- |
| `e2e/login-incident-sla.spec.ts` | Login lead → créer incident → SLA visible (détail + liste) |
| `e2e/postmortem-export.spec.ts` | Login lead → incident seed résolu → timeline post-mortem + exports |

Fixtures : [`e2e/fixtures/auth.ts`](../e2e/fixtures/auth.ts) (comptes `prisma db seed`).

## Prérequis locaux

Postgres + seed (comme pour Vitest) :

```bash
make db-up && make wait-db && make migrate && make seed
```

Installer le navigateur Chromium (une fois) :

```bash
npx playwright install chromium
```

## Lancer les tests

```bash
npm run test:e2e          # démarre next dev sur :3001 si absent
make test-e2e             # migrate + seed + build + test:e2e
npm run test:e2e:ui       # mode interactif Playwright
```

Variables utiles :

| Variable | Défaut | Rôle |
| -------- | ------ | ---- |
| `PORT` | `3001` (CI) / `3099` (local) | Port Next.js (webServer) |
| `PLAYWRIGHT_BASE_URL` | `http://127.0.0.1:3001` | URL de base des tests |
| `CI` |: | `true` → `next start` au lieu de `next dev` |

## CI GitHub Actions

Job **`e2e`** dans [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) :

1. Postgres service + migrate + seed
2. `npm run build`
3. `playwright install --with-deps chromium`
4. `npm run test:e2e`

En cas d'échec, le rapport HTML est uploadé en artefact `playwright-report`.

Protection branche : ajouter le check **`Playwright E2E`** aux status checks requis.

## Prochaine étape

**M17**: API contract OpenAPI.
