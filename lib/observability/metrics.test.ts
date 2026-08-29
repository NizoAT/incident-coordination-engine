import { describe, expect, it, beforeEach } from "vitest";

import {
  getMetricsSnapshot,
  incrementHttpRequests,
  recordSchedulerTick,
  resetMetricsForTests,
  setSchedulerRuntime,
} from "./metrics";

describe("observability metrics", () => {
  beforeEach(() => {
    resetMetricsForTests();
  });

  it("incrémente le compteur HTTP", () => {
    incrementHttpRequests();
    incrementHttpRequests();
    expect(getMetricsSnapshot().httpRequestsTotal).toBe(2);
  });

  it("enregistre un tick scheduler réussi", () => {
    setSchedulerRuntime(15_000, true);
    recordSchedulerTick({
      durationMs: 42,
      breached: 1,
      escalated: 2,
      openOverdue: 3,
    });

    const snapshot = getMetricsSnapshot();
    expect(snapshot.schedulerTicksTotal).toBe(1);
    expect(snapshot.schedulerTicksFailedTotal).toBe(0);
    expect(snapshot.schedulerLastTickDurationMs).toBe(42);
    expect(snapshot.slaBreachesProcessedTotal).toBe(1);
    expect(snapshot.escalationsProcessedTotal).toBe(2);
    expect(snapshot.slaOpenOverdue).toBe(3);
    expect(snapshot.schedulerRunning).toBe(true);
    expect(snapshot.schedulerIntervalMs).toBe(15_000);
  });

  it("compte les ticks en échec", () => {
    recordSchedulerTick({
      durationMs: 10,
      breached: 0,
      escalated: 0,
      openOverdue: 0,
      error: true,
    });

    expect(getMetricsSnapshot().schedulerTicksFailedTotal).toBe(1);
  });
});
