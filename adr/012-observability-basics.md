# ADR 012: Observability basique (M15)

## Statut

Accepté: M15

## Contexte

M1-M14 sans visibilité opérationnelle : pas de sonde applicative, logs texte ad hoc (`console.info`), aucune métrique scheduler/HTTP.

## Décision

1. **`GET /api/health`**: JSON avec checks Postgres (`SELECT 1`) + scheduler in-process ; HTTP 503 si dégradé.
2. **`GET /api/metrics`**: compteurs in-memory (JSON) + `?format=prometheus` pour scrape basique.
3. **Logs JSON**: `lib/observability/logger.ts` (`ts`, `level`, `msg`, `service`, champs libres) ; scheduler et middleware migrés.
4. **Middleware**: compteur `httpRequestsTotal` + log `http.request` sur `/api/*`, `/incidents/*`, `/changes/*` ; routes publiques health/metrics/webhooks sans auth.
5. **Métriques scheduler**: ticks, échecs, breaches/escalades cumulés, gauge `slaOpenOverdue` (incidents `open` + `slaStatus=breached`).
6. **Runbook** [`docs/ops.md`](../docs/ops.md) ; HEALTHCHECK Docker/Compose sur `/api/health`.

## Conséquences

- Sonde Nginx `/nginx-health` reste distincte (proxy seul) ; la santé métier passe par `/api/health`.
- Métriques per-process: scaling horizontal nécessiterait agrégation externe (hors scope portfolio).
- M16 publie l'image sur GHCR (ADR 013) ; M17+ API contract.

## Alternatives rejetées

- OpenTelemetry complet: surdimensionné pour M15.
- Prometheus client library + serveur dédié: YAGNI ; export texte suffit.
- Auth sur `/metrics`: complexité ops ; documenter exposition réseau interne.
