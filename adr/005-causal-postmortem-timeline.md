# ADR 005: Timeline causale post-mortem (M8)

## Statut

Accepté: M8

## Contexte

M6-M7 ont introduit changes, déploiements et webhooks. Les événements incident (`IncidentEvent`) contiennent déjà SLA, escalade et résolution: mais la vue timeline brute mélange assignations et transitions mineures, et les déploiements webhook peuvent être **horodatés au moment du deploy** alors que l'event `DeploymentDetected` reflète la liaison.

## Décision

1. **Reconstruction dédiée** (`buildCausalTimeline`): fusion relations + events filtrés, tri chronologique.
2. **Phases explicites** : change, deployment, incident, sla, escalation, resolution.
3. **Canonical timestamp deploy** : `Deployment.deployedAt` prioritaire sur l'event pour la phase deployment.
4. **Export** JSON + Markdown via `GET /api/incidents/[id]/postmortem`.
5. **UI** : filtre causal / complète sur la même page incident (client component).

## Conséquences

- Post-mortem exportable sans outil externe.
- Pas de nouvelle table: lecture seule sur données existantes.
- M9+ pourra ajouter `make export-postmortem` si besoin.

## Alternatives rejetées

- Table `PostMortem` matérialisée: YAGNI, events append-only suffisent.
- Graph DB causal: surdimensionné pour le portfolio.
