# ADR 010 — CI GitHub Actions (M13)

## Statut

Accepté — M13

## Contexte

M1–M12 sans pipeline automatisé — merge manuel sans garde-fou. Objectif portfolio : CI verte sur `main` + branche protégée.

## Décision

1. Workflow **`.github/workflows/ci.yml`** : lint → typecheck → test → build.
2. **Postgres 16** en service container + `migrate deploy` + **seed** (tests Prisma).
3. Job secondaire **docker-prod-build** (M11) avec cache BuildKit GHA.
4. Scripts npm : `typecheck`, `ci` ; Make : `make ci`.
5. Secrets CI = placeholders explicites (pas de GitHub Secrets requis pour le pipeline de base).
6. Doc protection branche dans `docs/CI.md` (config manuelle GitHub).

## Conséquences

- Chaque PR vers `main` exécute la même chaîne que `make ci` (+ Docker).
- Scan Trivy reste local/optionnel (M11) — hors job CI par défaut (install binaire).
- M15 ajoute `/api/health`, logs JSON et métriques (ADR 012).

## Alternatives rejetées

- Tests sans Postgres — ignorerait les 5 suites d'intégration RELEASE.
- Matrix Node 18/20/22 — YAGNI pour portfolio ; Node 20 LTS suffit.
