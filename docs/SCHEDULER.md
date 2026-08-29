# Scheduler SLA + escalade (M4–M5)

## Mécanisme

- **Type :** in-process, single-node (`setInterval` via `instrumentation.ts`)
- **Modules :**
  - `lib/sla/service.ts` → `processSlaBreaches()`
  - `lib/escalation/service.ts` → `processEscalations()`
- **Ordre d'un tick :** SLA breach d'abord, puis escalades

## Intervalle

| Variable | Défaut | Description |
| -------- | ------ | ----------- |
| `SLA_TICK_INTERVAL_MS` | `30000` (30 s) | Fréquence du tick |

## Escalade (M5)

Voir [`RUNBOOK_ESCALATION.md`](RUNBOOK_ESCALATION.md).

## Limitations

- Pas de garantie multi-instance
- Idempotence via contrainte unique `EscalationDelivery.idempotencyKey`
