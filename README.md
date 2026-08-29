# Incident Coordination Engine (ICE)

**Moteur de coordination d'incidents** — lifecycle, SLA, escalade, causalité, webhook GitHub, **post-mortem**.

**Milestone actuel : M8** — timeline causale exportable.

## Démarrage

```bash
cp .env.example .env
npm run db:up && npm run db:migrate && npm run db:seed
npm run dev -- -p 3001
```

Comptes démo : `lead@demo.local` / `responder@demo.local` — mot de passe `demo123`.

## M8 — périmètre

- Reconstruction **Change → Déploiement → Incident → Escalade → Résolution**
- Filtre timeline **causale** / complète sur détail incident
- Export **JSON** et **Markdown** : `GET /api/incidents/[id]/postmortem`
- Doc : [`docs/POSTMORTEM.md`](docs/POSTMORTEM.md)

## Parcours M1–M8

| M | Capacité |
| - | -------- |
| M1–M2 | Lifecycle + timeline |
| M3 | Auth RBAC |
| M4–M5 | SLA + escalade idempotente |
| M6 | Change / Deployment manuel |
| M7 | Webhook GitHub idempotent |
| **M8** | **Post-mortem causal exportable** |

```bash
npm test && npm run build
```

## Prochain milestone

**M9** — bootstrap reproductible (`make setup`, `make dev`, `make test`).
