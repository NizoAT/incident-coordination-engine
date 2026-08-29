export interface SchedulerTickResult {
  durationMs: number;
  breached: number;
  escalated: number;
  openOverdue: number;
  error?: boolean;
}

export interface MetricsSnapshot {
  httpRequestsTotal: number;
  schedulerTicksTotal: number;
  schedulerTicksFailedTotal: number;
  schedulerLastTickAt: string | null;
  schedulerLastTickDurationMs: number | null;
  schedulerLastTickBreached: number | null;
  schedulerLastTickEscalated: number | null;
  slaBreachesProcessedTotal: number;
  escalationsProcessedTotal: number;
  slaOpenOverdue: number;
  schedulerRunning: boolean;
  schedulerIntervalMs: number;
}

interface MetricsStore extends MetricsSnapshot {}

declare global {
  var __iceMetrics: MetricsStore | undefined;
}

function createStore(): MetricsStore {
  return {
    httpRequestsTotal: 0,
    schedulerTicksTotal: 0,
    schedulerTicksFailedTotal: 0,
    schedulerLastTickAt: null,
    schedulerLastTickDurationMs: null,
    schedulerLastTickBreached: null,
    schedulerLastTickEscalated: null,
    slaBreachesProcessedTotal: 0,
    escalationsProcessedTotal: 0,
    slaOpenOverdue: 0,
    schedulerRunning: false,
    schedulerIntervalMs: 30_000,
  };
}

function store(): MetricsStore {
  if (!globalThis.__iceMetrics) {
    globalThis.__iceMetrics = createStore();
  }
  return globalThis.__iceMetrics;
}

export function incrementHttpRequests(): void {
  store().httpRequestsTotal += 1;
}

export function setSchedulerRuntime(intervalMs: number, running: boolean): void {
  const s = store();
  s.schedulerIntervalMs = intervalMs;
  s.schedulerRunning = running;
}

export function recordSchedulerTick(result: SchedulerTickResult): void {
  const s = store();
  s.schedulerTicksTotal += 1;
  if (result.error) {
    s.schedulerTicksFailedTotal += 1;
  }

  s.schedulerLastTickAt = new Date().toISOString();
  s.schedulerLastTickDurationMs = result.durationMs;
  s.schedulerLastTickBreached = result.breached;
  s.schedulerLastTickEscalated = result.escalated;
  s.slaBreachesProcessedTotal += result.breached;
  s.escalationsProcessedTotal += result.escalated;
  s.slaOpenOverdue = result.openOverdue;
}

export function getMetricsSnapshot(): MetricsSnapshot {
  return { ...store() };
}

/** Remet les compteurs à zéro: réservé aux tests. */
export function resetMetricsForTests(): void {
  globalThis.__iceMetrics = createStore();
}
