# ADR 003: Extension causale Change / Deployment (M6)

**Date :** 2026-08-29  
**Statut :** Accepté

## Contexte

Après RELEASE M1-M5 (lifecycle, SLA, escalade), le produit doit répondre à : « Qu'est-ce qui a causé cet incident ? »

Les champs `sourceType` / `sourceId` existent sur `IncidentEvent` depuis M2 sans logique métier.

## Décision

1. **Tables dédiées** `Change` et `Deployment` (pas de polymorphisme générique over-engineered).
2. **Relations N-N** via `IncidentChange` et `IncidentDeployment`: un incident peut référencer plusieurs changements/déploiements.
3. **Events** `ChangeLinked` et `DeploymentDetected` avec `sourceType`/`sourceId` renseignés.
4. **Ingestion manuelle M6**: page `/changes` + formulaires sur détail incident ; **webhook GitHub → M7**.

## Alternatives écartées

| Option | Raison |
| ------ | ------ |
| FK directe `incident.changeId` | Un seul changement max: insuffisant post-mortem |
| Framework causal générique | YAGNI: deux entités suffisent pour le portfolio |
| Webhook dès M6 | Dilue le milestone ; M7 dédié idempotence ingestion |

## Conséquences

- Timeline reconstructible : Change → Incident → Escalade (M8 affinera la vue causale)
- Seed démo lie CHG-842 / v2.4.1 à l'incident checkout
- Prochain : M7 webhook idempotent

## Références

- [`adr/001-sequencing-and-architecture.md`](001-sequencing-and-architecture.md) (D1, D3)
- Parcours `06_PROJECT_SEQUENCE.md`: M6
