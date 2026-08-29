# ADR 011 — Tests E2E Playwright (M14)

## Statut

Accepté — M14

## Contexte

M1–M13 : couverture Vitest (unit + intégration Prisma) sans validation des parcours UI (login, formulaires server actions, Radix Select, badges SLA).

## Décision

1. **`@playwright/test`** avec config [`playwright.config.ts`](../playwright.config.ts).
2. **Deux parcours** alignés sur la spec :
   - login → créer incident → SLA visible ;
   - login → incident seed → timeline post-mortem + liens export.
3. **Fixtures seed** réutilisées (`lead@demo.local` / `demo123`) — pas de compte E2E dédié.
4. **webServer** Playwright :
   - local : port **3099** (évite conflit avec `make dev` :3001) ; `next start` si build présent ;
   - CI : `next start` sur :3001 après `npm run build`.
5. Job CI **`e2e`** séparé (depends on lint-typecheck-test-build), artefact rapport en cas d'échec.
6. Scripts : `npm run test:e2e`, `make test-e2e`.

## Conséquences

- Régressions UI détectées avant merge (avec protection branche).
- E2E plus lents que Vitest — job dédié, workers=1, pas dans `npm run ci` par défaut.
- Radix Select testé via rôles ARIA (`option`), pas de `data-testid` ajoutés.

## Alternatives rejetées

- Cypress — écosystème Playwright plus adapté à Next.js + CI GHA.
- Un seul parcours login-only — ne couvre pas le risque métier SLA.
- Docker Compose pour E2E en CI — surcoût ; Postgres service + `next start` suffit.
