# Incident Coordination Engine (ICE)

**Moteur de coordination d'incidents** — pas un incident tracker CRUD.

ICE garantit le **lifecycle sous contrainte temporelle** : SLA comptés, escalades **idempotentes** (un seul envoi même si le worker tourne deux fois), mises à jour concurrentes gérées par **versioning optimiste** (409), timeline **immuable** pour post-mortem, et lien causal Change → Déploiement → Incident.

Projet portfolio — démonstration d'ingénierie backend/system design, pas un pari produit commercial vs Jira/PagerDuty.

**Tag release noyau :** [`v0.1.0-core`](https://github.com/NizoAT/incident-coordination-engine/releases/tag/v0.1.0-core) (M1–M5) · **Milestone actuel :** M8 (timeline causale exportable)

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

TypeScript · Next.js 16 · Prisma 6 · Postgres · iron-session · Zod · Vitest · Tailwind + Radix UI

---

## Démarrage local

```bash
cp .env.example .env
npm run db:up && npm run db:migrate && npm run db:seed
npm run dev -- -p 3001
```

**Comptes de démonstration locaux uniquement** — ne jamais utiliser en production :

| Rôle | Email | Mot de passe |
| ---- | ----- | ------------ |
| Lead | `lead@demo.local` | `demo123` |
| Responder | `responder@demo.local` | `demo123` |

Ces identifiants sont créés par `prisma db seed` pour le dev local. Ils sont documentés volontairement (pas un secret d'infrastructure).

```bash
npm test && npm run build
```

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

Documentation : [`docs/`](docs/) · ADR : [`adr/`](adr/)

---

## Limitations connues

- Scheduler SLA/escalade **in-process** (pas de queue distribuée) — volontaire pour le scope portfolio.
- Pas de SSO, rate limiting ni hardening prod — prévu M9+ (bootstrap, Docker, CI).
- Historique Git **reconstitué par milestone** (progression logique documentée, pas commits temps réel).

---

## Roadmap

- **M9** — bootstrap reproductible (`make setup`, `make dev`, `make test`)
- **M10+** — Docker Compose, CI, observability, déploiement

Voir [`TODO.md`](TODO.md).

---

## Licence

[MIT](LICENSE)
