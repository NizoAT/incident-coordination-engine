# ADR 014: Migrations Prisma découplées du runtime (post-M16)

## Statut

Accepté: post-M16 (pré-push)

## Contexte

L'image production (M11) exécutait `prisma migrate deploy` dans l'entrypoint du conteneur applicatif. Cela imposait d'embarquer le paquet **`prisma`** (CLI complète) dans l'image **runner**, en plus de `@prisma/client`.

Conséquences :

- ~20 CVE CRITICAL/HIGH Trivy sur les dépendances transitives du CLI (tar, glob, minimatch, etc.).
- Surface d'attaque et taille d'image augmentées pour un artefact qui sert le trafic HTTP.
- Confusion sémantique : une migration est une **opération de déploiement**, pas une dépendance applicative.

## Décision

1. **Image runtime** (`Dockerfile` stage `runner`) : **`@prisma/client` + engines** (`.prisma/`) uniquement. **Pas** de dossier `node_modules/prisma`, pas de schéma `prisma/` copié au runtime. **Pas** de `npm`/`npx` (retirés de l'image base Node).
2. **Entrypoint prod** : attente Postgres (`POSTGRES_HOST`) puis `exec` de l'app. **Aucune** migration au démarrage.
3. **CI/CD** : job `migrate-staging` dans `cd.yml`, activé si variable repo `STAGING_MIGRATE_ENABLED=true` et secret `STAGING_DATABASE_URL`. S'exécute après publication GHCR, avant `docker compose pull/up` sur l'hôte staging.
4. **Local prod** : cible Make `deploy-prod` = Postgres up → `make migrate` (hôte) → stack complète. Alternative : `make migrate` manuel avant `make up-prod`.

## Conséquences

- `make docker-scan` (Trivy CRITICAL/HIGH) peut passer sur l'image applicative.
- Deploy staging explicite en deux temps : migrations (CI ou hôte) puis pull/up de l'image.
- ADR 008 (entrypoint migrate) partiellement supersédé sur le point migrations.

## Alternatives rejetées

- **Image migrator séparée** (option B) : plus de moving parts pour un gain similaire sur le scan runtime.
- **Garder CLI Prisma en runtime + documenter CVE** : honnête mais régression évitable, pas une limitation structurelle.
- **Distroless sans Prisma engines** : complexité disproportionnée pour ce portfolio.
