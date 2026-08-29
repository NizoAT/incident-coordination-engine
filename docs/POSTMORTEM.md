# Post-mortem — timeline causale (M8)

## Objectif

Reconstituer une **timeline opérationnelle** pour post-mortem :

```text
Changement → Déploiement → Incident → SLA / Escalade → Résolution
```

## UI

Sur le détail incident (`/incidents/[id]`) :

- Filtre **Causale** (défaut) vs **Complète**
- Badges de phase colorés
- Boutons **Export JSON** / **Export Markdown**

## API

```text
GET /api/incidents/{id}/postmortem?format=json
GET /api/incidents/{id}/postmortem?format=markdown
```

Auth session requise (même RBAC que l'incident).

Réponse avec `Content-Disposition: attachment` pour téléchargement direct.

## Événements causaux

| Type | Phase |
| ---- | ----- |
| `ChangeLinked` | change |
| `DeploymentDetected` | deployment |
| `IncidentCreated` | incident |
| `SlaStarted`, `SlaBreached` | sla |
| `EscalationTriggered` | escalation |
| `StatusChanged` → `resolved` | resolution |

Exclus du filtre causal : assignation, sévérité, transitions intermédiaires.

## Horodatage déploiement

Les déploiements liés utilisent `Deployment.deployedAt` (moment réel du deploy), pas l'heure de liaison — essentiel pour voir un deploy **avant** l'incident.

## Exemple curl

```bash
curl -s -b cookies.txt \
  "http://localhost:3001/api/incidents/{id}/postmortem?format=markdown" \
  -o postmortem.md
```
