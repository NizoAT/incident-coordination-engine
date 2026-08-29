# Getting started (< 10 min)

Guide bootstrap **M9** — de `git clone` à l'app qui tourne.

## Prérequis

| Outil | Version | Vérification |
| ----- | ------- | ------------ |
| Node.js | ≥ 20 | `node -v` |
| Docker | Compose v2 | `docker compose version` |
| Make | any | `make -v` |
| Git | any | `git clone …` |

## Chemin rapide — hôte natif (M9)

```bash
git clone https://github.com/NizoAT/incident-coordination-engine.git
cd incident-coordination-engine

make setup    # ~3–5 min (npm ci + Postgres + migrations + seed)
make dev      # http://localhost:3001
```

## Chemin rapide — Docker Compose (M10)

Sans Node local pour l'application :

```bash
git clone https://github.com/NizoAT/incident-coordination-engine.git
cd incident-coordination-engine

docker compose up --build
# ou : make up
```

→ http://localhost:3001 — voir [`DOCKER_COMPOSE.md`](DOCKER_COMPOSE.md)

Connexion démo (local uniquement, ne pas utiliser en prod) :

- `lead@demo.local` / `demo123`
- `responder@demo.local` / `demo123`

## Ce que fait `make setup`

1. Vérifie Node ≥ 20, Docker Compose, Make
2. Copie `.env.example` → `.env` si absent
3. `npm ci`
4. `docker compose up -d postgres` (Postgres sur port **5433**)
5. Attente santé Postgres (`scripts/wait-for-postgres.sh`)
6. `prisma migrate deploy` (non interactif)
7. `prisma db seed` (incidents + comptes démo)

## Commandes Make

```bash
make help      # liste des cibles
make setup     # bootstrap hôte
make up        # Compose web + db (M10)
make compose   # Compose premier plan
make dev       # serveur dev hôte
make down      # arrête la stack Compose
make test      # Vitest
make build     # build production
make check     # test + build (CI locale)
make logs      # logs Compose web + postgres
make db-reset  # reset complet DB + seed
```

Port custom : `make dev PORT=4000`

## Dépannage

### Postgres ne démarre pas

```bash
docker compose ps
docker compose logs postgres
make db-down && make db-up && make wait-db
```

### Port 5433 déjà utilisé

Modifier le mapping dans `compose.yaml` et `DATABASE_URL` dans `.env`.

### Migrations en échec

```bash
make db-reset   # ⚠ efface les données locales
```

### `SESSION_SECRET` trop court

Éditer `.env` — minimum **32 caractères** (requis par iron-session).

## Alternative npm (sans Make)

```bash
cp .env.example .env
npm ci
npm run db:up
./scripts/wait-for-postgres.sh
npm run db:migrate:deploy
npm run db:seed
npm run dev -- -p 3001
```

## Prochaine étape

**M11** — Dockerfile multi-stage production.
