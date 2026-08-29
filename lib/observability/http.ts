import type { NextRequest } from "next/server";

import { incrementHttpRequests, getMetricsSnapshot } from "./metrics";
import { logHttpRequest } from "./logger";

const PUBLIC_API_PREFIXES = [
  "/api/health",
  "/api/metrics",
  "/api/webhooks/",
] as const;

export function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function observeHttpRequest(request: NextRequest): void {
  incrementHttpRequests();
  logHttpRequest({
    method: request.method,
    path: `${request.nextUrl.pathname}${request.nextUrl.search}`,
  });
}

export function formatPrometheusMetrics(): string {
  const m = getMetricsSnapshot();
  const lines = [
    "# HELP ice_http_requests_total Nombre de requêtes HTTP observées par le middleware",
    "# TYPE ice_http_requests_total counter",
    `ice_http_requests_total ${m.httpRequestsTotal}`,
    "# HELP ice_scheduler_ticks_total Ticks du scheduler SLA/escalade",
    "# TYPE ice_scheduler_ticks_total counter",
    `ice_scheduler_ticks_total ${m.schedulerTicksTotal}`,
    "# HELP ice_scheduler_ticks_failed_total Ticks en échec",
    "# TYPE ice_scheduler_ticks_failed_total counter",
    `ice_scheduler_ticks_failed_total ${m.schedulerTicksFailedTotal}`,
    "# HELP ice_sla_breaches_processed_total SLA marqués breached par le scheduler",
    "# TYPE ice_sla_breaches_processed_total counter",
    `ice_sla_breaches_processed_total ${m.slaBreachesProcessedTotal}`,
    "# HELP ice_escalations_processed_total Escalades envoyées par le scheduler",
    "# TYPE ice_escalations_processed_total counter",
    `ice_escalations_processed_total ${m.escalationsProcessedTotal}`,
    "# HELP ice_sla_open_overdue Incidents ouverts en SLA dépassé (dernier tick)",
    "# TYPE ice_sla_open_overdue gauge",
    `ice_sla_open_overdue ${m.slaOpenOverdue}`,
    "# HELP ice_scheduler_running Scheduler in-process actif (1/0)",
    "# TYPE ice_scheduler_running gauge",
    `ice_scheduler_running ${m.schedulerRunning ? 1 : 0}`,
  ];

  return `${lines.join("\n")}\n`;
}
