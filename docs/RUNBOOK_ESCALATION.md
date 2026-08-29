# Runbook — Escalade (M5)

## Quand une escalade part ?

```text
Incident status = open
  AND slaStatus = breached
  AND EscalationPolicy active pour la sévérité
  → INSERT EscalationDelivery (idempotencyKey unique)
  → si INSERT OK : notification lead + EscalationTriggered
  → si duplicate key : skip (idempotent)
```

## Clé d'idempotence

```text
idempotencyKey = "{incidentId}:{policyId}:{escalationWindowId}"
```

`escalationWindowId` = `slaCycleId` courant (metadata `SlaBreached`).

## Invariant

Escalade **uniquement** si `status === 'open'` (pas ack / resolved / investigating).

## Notification (M5)

- Canal minimum : **log structuré** (`[escalation-notify]` JSON) + `NotificationLog` channel `log`
- Destinataires : tous les users `role = lead`

## Diagnostic

```sql
-- Deliveries pour un incident
SELECT id, idempotencyKey, status, sentAt FROM "EscalationDelivery"
WHERE "incidentId" = '<uuid>';

-- Timeline
SELECT type, metadata, timestamp FROM "IncidentEvent"
WHERE "incidentId" = '<uuid>' ORDER BY timestamp;
```

## Scénarios RELEASE (tests)

| # | Scénario | Commande |
| - | -------- | -------- |
| 1 | Critical sans ack → escalade | `npm test -- lib/escalation/service.test.ts` |
| 2 | Job dupliqué → 1 notification | idem (test 2) |
| 3 | PATCH concurrent version 7 → 409 | `npm test -- lib/incidents/patch.test.ts` |

## API PATCH (optimistic lock)

```http
PATCH /api/incidents/{id}
Content-Type: application/json
Cookie: ice_session=...

{ "version": 7, "status": "acknowledged" }
```

- **409** si `version` ne correspond plus (`VERSION_CONFLICT`)
- **401** si non authentifié

## Limitations

- Scheduler in-process (single-node) — voir [`SCHEDULER.md`](SCHEDULER.md)
- Pas de retry notification avancé (M5 minimal)
- Email/Slack : extension future
