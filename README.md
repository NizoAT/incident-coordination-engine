# Incident Coordination Engine (ICE)

[![CI](https://github.com/NizoAT/incident-coordination-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/NizoAT/incident-coordination-engine/actions/workflows/ci.yml)

**Moteur de coordination d'incidents** — pas un incident tracker CRUD.

ICE garantit le **lifecycle sous contrainte temporelle** : SLA comptés, escalades **idempotentes** (un seul envoi même si le worker tourne deux fois), mises à jour concurrentes gérées par **versioning optimiste** (409), timeline **immuable** pour post-mortem, et lien causal Change → Déploiement → Incident.

Projet portfolio — démonstration d'ingénierie backend/system design, pas un pari produit commercial vs Jira/PagerDuty.

**Tag release noyau :** [`v0.1.0-core`](https://github.com/NizoAT/incident-coordination-engine/releases/tag/v0.1.0-core) (M1–M5) · **Milestone actuel :** M16 (CD GHCR)

---

## Pourquoi ce projet existe

| ICE (ce repo) | Incident tracker générique |
| ------------- | -------------------------- |
| SLA + escalade avec garanties d'idempotence | CRUD + notifications |
| Event-log séparé de l'état courant | Historique optionnel |
| Concurrence : PATCH avec conflit 409 | Dernier write gagne |
| Extension causale M6–M8 | Intégrations absentes |

**Questions entretien couvertes :**

- *Que se passe-t-il si le worker d'escalade tourne deux fois ?* → `EscalationDelivery.idempotencyKey` unique, un seul envoi.
- *Deux responders modifient l'incident en même temps ?* → `version` optimiste, 409 si stale.
- *Pourquoi séparer timeline et état courant ?* → reconstruction post-mortem sans event sourcing complet.

---

## Stack

TypeScript · Next.js 16 · Prisma 6 · Postgres · iron-session · Zod · Vitest · Playwright · Tailwind + Radix UI

---

## Démarrage local (< 10 min)

### Option A — Docker Compose (web + Postgres, M10)

```bash
docker compose up --build
# ou : make up
```

→ http://localhost:8080 (via **Nginx**, pas `:3001` direct)

Doc : [`docs/DOCKER_COMPOSE.md`](docs/DOCKER_COMPOSE.md) · [`docs/NGINX.md`](docs/NGINX.md)

### Option A2 — Compose production (M11)

```bash
make docker-build-prod   # image multi-stage non-root
make up-prod             # ou : docker compose -f compose.prod.yaml up --build
```

Doc : [`docs/DOCKER_PROD.md`](docs/DOCKER_PROD.md)

### Option A3 — Staging GHCR (M16)

Image publiée par le workflow CD — pas de build local :

```bash
cp .env.staging.example .env.staging   # éditer les secrets
make pull-staging && make up-staging
```

Doc : [`docs/CD.md`](docs/CD.md)

### Option B — Hôte natif (M9)

```bash
make setup && make dev
```

Guide : [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md)

```bash
make test     # ou make ci (lint + typecheck + test + build)
make test-e2e # Playwright — login + incident + SLA (M14)
```

Doc CI : [`docs/CI.md`](docs/CI.md) · Doc E2E : [`docs/E2E.md`](docs/E2E.md) · Runbook : [`docs/ops.md`](docs/ops.md) · CD : [`docs/CD.md`](docs/CD.md)

**Comptes de démonstration locaux uniquement** — ne jamais utiliser en production :

| Rôle | Email | Mot de passe |
| ---- | ----- | ------------ |
| Lead | `lead@demo.local` | `demo123` |
| Responder | `responder@demo.local` | `demo123` |

Ces identifiants sont créés par `prisma db seed` pour le dev local. Ils sont documentés volontairement (pas un secret d'infrastructure).

**Prérequis :** Node ≥ 20, Docker Compose, Make.

---

## Capacités (M1–M8)

| M | Capacité |
| - | -------- |
| M1–M2 | Lifecycle + timeline append-only (`IncidentEvent`) |
| M3 | Auth RBAC (lead / responder), `actorId` sur les events |
| M4–M5 | SLA policies, scheduler in-process, escalade idempotente, PATCH API |
| M6 | Registre causal Change / Deployment |
| M7 | Webhook GitHub (`deployment_status`) avec idempotence |
| M8 | Timeline post-mortem causale + export JSON/Markdown |
| **M9** | **Bootstrap `make setup` / `dev` / `test`** |
| **M10** | **Compose dev web + Postgres (`docker compose up`)** |
| **M11** | **Dockerfile multi-stage prod + scan Trivy** |
| **M12** | **Nginx reverse proxy + headers sécu** |
| **M13** | **CI GitHub Actions (lint → test → build)** |
| **M14** | **E2E Playwright (login + incident + SLA)** |
| **M15** | **Observability (`/api/health`, logs JSON, métriques)** |
| **M16** | **CD GHCR + deploy staging (`compose.staging.yaml`)** |

Documentation : [`docs/`](docs/) · ADR : [`adr/`](adr/)

---

## Limitations connues

- Scheduler SLA/escalade **in-process** (pas de queue distribuée) — volontaire pour le scope portfolio.
- Pas de SSO, rate limiting ni hardening prod — prévu M10+ (Compose web, CI).
- Historique Git **reconstitué par milestone** (progression logique documentée, pas commits temps réel).

---

## Roadmap

- **M17+** — API contract OpenAPI (mobile)

Voir [`TODO.md`](TODO.md).

---

## Licence

[MIT](LICENSE)
