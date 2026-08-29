# ADR 006: Bootstrap reproductible via Makefile (M9)

## Statut

Accepté: M9

## Contexte

Après M8, démarrer ICE exigeait 5+ commandes npm/docker manuelles et `prisma migrate dev` (interactif). `git clone` seul ne suffisait pas: objectif portfolio : onboarding < 10 min.

## Décision

1. **Makefile** comme interface unique : `make setup`, `make dev`, `make test`.
2. **`make setup`** enchaîne : prérequis → `.env` → `npm ci` → Compose Postgres → wait → `migrate deploy` → seed.
3. Scripts shell atomiques dans `scripts/` (`ensure-env.sh`, `wait-for-postgres.sh`).
4. **`db:migrate:deploy`** npm pour CI/bootstrap ; `db:migrate` (`migrate dev`) reste pour le dev schema.
5. Doc `docs/GETTING_STARTED.md` avec chemin Make + fallback npm.

## Conséquences

- Onboarding reproductible sans connaissance interne du repo.
- M10 pourra étendre Compose (service web) sans changer l'interface Make.
- Make requis: acceptable pour cible devops/portfolio ; fallback npm documenté.

## Alternatives rejetées

- Script npm unique (`npm run setup`): moins visible pour profil DevOps que Make.
- `migrate dev` dans setup: bloque en non-interactif.
