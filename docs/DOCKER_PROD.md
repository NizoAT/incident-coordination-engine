# Image production multi-stage (M11)

Image **optimisée** distincte de `Dockerfile.dev` (M10) : build standalone Next.js, utilisateur non-root, surface réduite.

## Build & scan

```bash
make docker-build-prod    # tag incident-coordination-engine:prod
make docker-size          # taille image (cible < 400 MB)
make docker-scan          # Trivy CRITICAL/HIGH (exit 0 attendu)
```

### Dernier scan Trivy (local, 2026-08-29)

| Cible | CRITICAL/HIGH |
| ----- | ------------- |
| Alpine (OS) | **0** |
| App Next standalone + `@prisma/client` | **0** |
| CLI `npm` (base Node) | retiré du runtime (ADR 014) |

`make docker-scan` **passe** (exit 0) sur l'image prod actuelle.

Stack complète (recommandé) :

```bash
make deploy-prod          # Postgres + migrate hôte + compose prod
make down-prod
```

Alternative :

```bash
make migrate              # après Postgres up (port 5433)
make up-prod
```

→ http://localhost:8080 (via Nginx)

## Architecture Dockerfile

| Stage | Rôle |
| ----- | ---- |
| `deps` | `npm ci` + Prisma schema |
| `builder` | `prisma generate` + `next build` (output standalone) |
| `runner` | Standalone Next + `@prisma/client` (pas de CLI `prisma`) |

## Sécurité

- **USER nextjs**: pas de root au runtime
- Pas de devDependencies, CLI Prisma ni npm dans l'image finale
- `.dockerignore` exclut tests, docs, `.env`
- `HEALTHCHECK` sur `/api/health`
- Entrypoint : attente Postgres uniquement (pas de `migrate deploy` au runtime)

## Variables d'environnement

| Variable | Requis | Description |
| -------- | ------ | ----------- |
| `DATABASE_URL` | oui | Postgres (injectée par Compose) |
| `SESSION_SECRET` | oui | ≥ 32 caractères |
| `GITHUB_WEBHOOK_SECRET` | oui | Webhook HMAC |
| `POSTGRES_HOST` | Compose | Active l'attente Postgres dans l'entrypoint |

## Seed en prod

Pas de seed automatique. Pour démo locale :

```bash
# Postgres + app prod up, puis depuis l'hôte :
npm run db:seed
# (DATABASE_URL=localhost:5433)
```

## Cible taille

Objectif portfolio : **< 400 MB** (Alpine + Next standalone + Prisma engines).

Vérification :

```bash
make docker-build-prod && make docker-size
```

## Comparaison dev vs prod

| | `Dockerfile.dev` | `Dockerfile` |
| - | ---------------- | ------------ |
| Mode | `next dev` hot reload | `node server.js` |
| User | root (dev) | nextjs |
| Volumes | bind-mount source | aucun |
| Compose | `compose.yaml` | `compose.prod.yaml` |
| Migrations | hôte / entrypoint dev | CI/CD ou `make deploy-prod` |

## Prochaine étape

**M16**: CD GHCR · **M17+**: voir [`docs/CD.md`](CD.md).
