# Runbook ops: Incident Coordination Engine (M15)

Observabilité minimale pour diagnostiquer la santé de l'app, le scheduler SLA et la charge HTTP.

## Endpoints

| Endpoint | Auth | Description |
| -------- | ---- | ----------- |
| `GET /api/health` | Non | Liveness/readiness JSON (503 si dégradé) |
| `GET /api/metrics` | Non | Compteurs in-process (JSON) |
| `GET /api/metrics?format=prometheus` | Non | Export texte compatible Prometheus |
| `GET /nginx-health` | Non | Sonde Nginx uniquement (pas l'app) |

Via Compose/Nginx (port **8080**) :

```bash
curl -s http://localhost:8080/api/health | jq .
curl -s http://localhost:8080/api/metrics | jq .
curl -s http://localhost:8080/api/metrics?format=prometheus
```

Hôte natif (`make dev`, port **3001**) :

```bash
curl -s http://localhost:3001/api/health | jq .
```

## Exemple `/api/health`

```json
{
  "status": "ok",
  "service": "incident-coordination-engine",
  "version": "0.1.0",
  "uptimeSeconds": 842,
  "checks": {
    "database": { "ok": true, "latencyMs": 4 },
    "scheduler": {
      "ok": true,
      "running": true,
      "intervalMs": 30000,
      "lastTickAt": "2026-08-29T12:00:00.000Z",
      "ticksFailedTotal": 0
    }
  },
  "sla": {
    "openOverdueCount": 1
  }
}
```

| Champ | Interprétation |
| ----- | -------------- |
| `status: degraded` | Postgres inaccessible **ou** scheduler in-process arrêté |
| `sla.openOverdueCount` | Incidents **ouverts** avec `slaStatus = breached` |
| `checks.scheduler.ticksFailedTotal` | Ticks en erreur depuis le démarrage du process |

## Métriques (`/api/metrics`)

| Métrique | Type | Signification |
| -------- | ---- | ------------- |
| `httpRequestsTotal` | counter | Requêtes vues par le middleware (`/api/*`, `/incidents/*`, `/changes/*`) |
| `schedulerTicksTotal` | counter | Exécutions du job SLA + escalade |
| `schedulerTicksFailedTotal` | counter | Ticks en échec |
| `slaBreachesProcessedTotal` | counter | SLA passés en `breached` par le scheduler |
| `escalationsProcessedTotal` | counter | Escalades envoyées |
| `slaOpenOverdue` | gauge | Dernier décompte d'incidents ouverts en breach |
| `schedulerRunning` | bool | Scheduler actif dans ce process Node |

## Logs structurés JSON

Chaque ligne stdout est un objet JSON :

```json
{
  "ts": "2026-08-29T12:00:01.234Z",
  "level": "info",
  "msg": "scheduler.tick",
  "service": "ice",
  "durationMs": 38,
  "breached": 0,
  "escalated": 1,
  "openOverdue": 1
}
```

Événements clés :

| `msg` | Quand |
| ----- | ----- |
| `http.request` | Passage middleware (method + path) |
| `scheduler.started` | Démarrage via `instrumentation.ts` |
| `scheduler.tick` | Fin de chaque tick |
| `scheduler.tick_failed` | Erreur Prisma / métier pendant un tick |
| `health.degraded` | Réponse 503 sur `/api/health` |

Filtrer avec `jq` :

```bash
docker compose logs web 2>&1 | jq -c 'select(.msg == "scheduler.tick")'
```

## Procédures

### `status: degraded`: base de données

1. Vérifier Postgres : `docker compose ps postgres` ou `make wait-db`
2. Tester `DATABASE_URL` : `npm run db:migrate:deploy`
3. Relancer la stack : `make up` ou `make dev`

### `status: degraded`: scheduler

Le scheduler est **in-process** (un seul worker par instance Node). Il démarre via [`instrumentation.ts`](../instrumentation.ts).

1. Confirmer `NEXT_RUNTIME=nodejs` (pas Edge)
2. Vérifier les logs `scheduler.started`
3. Redémarrer le conteneur / process `web`
4. Contrôler `SLA_TICK_INTERVAL_MS` (défaut 30000)

### SLA overdue élevé

1. Lister les incidents ouverts en breach dans l'UI ou via seed « Démo SLA: breach automatique »
2. Vérifier que le scheduler tourne (`schedulerRunning: true`)
3. Attendre un tick ou réduire `SLA_TICK_INTERVAL_MS` en local

### Sonde Docker / Compose

- Image prod : `HEALTHCHECK` sur `/api/health` (voir [`Dockerfile`](../Dockerfile))
- Compose : service `web` healthcheck sur `/api/health`

## Limitations (volontaires M15)

- Compteurs **in-memory**: remis à zéro au restart ; pas de Prometheus sidecar
- Pas de tracing distribué ni corrélation request-id
- `/api/metrics` non authentifié: exposer uniquement sur réseau interne en prod

## Prochaine étape

**M17**: API contract OpenAPI (préparation mobile).
