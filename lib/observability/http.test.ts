import { describe, expect, it } from "vitest";

import { formatPrometheusMetrics, isPublicApiPath } from "./http";
import { getMetricsSnapshot, incrementHttpRequests, resetMetricsForTests } from "./metrics";
import { resolveHealthStatus } from "./health";

describe("observability health helpers", () => {
  it("résout ok uniquement si DB et scheduler sont sains", () => {
    expect(resolveHealthStatus(true, true)).toBe("ok");
    expect(resolveHealthStatus(false, true)).toBe("degraded");
    expect(resolveHealthStatus(true, false)).toBe("degraded");
    expect(resolveHealthStatus(false, false)).toBe("degraded");
  });
});

describe("observability http helpers", () => {
  it("identifie les routes API publiques", () => {
    expect(isPublicApiPath("/api/health")).toBe(true);
    expect(isPublicApiPath("/api/metrics")).toBe(true);
    expect(isPublicApiPath("/api/webhooks/github")).toBe(true);
    expect(isPublicApiPath("/api/incidents/abc")).toBe(false);
  });

  it("exporte des métriques Prometheus text", () => {
    resetMetricsForTests();
    incrementHttpRequests();

    const body = formatPrometheusMetrics();
    expect(body).toContain("ice_http_requests_total 1");
    expect(body).toContain("ice_scheduler_ticks_total");
    expect(body).toContain("# TYPE ice_sla_open_overdue gauge");
    expect(getMetricsSnapshot().httpRequestsTotal).toBe(1);
  });
});
