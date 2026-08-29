import { log } from "@/lib/observability/logger";
import { recordSchedulerTick, setSchedulerRuntime } from "@/lib/observability/metrics";

const DEFAULT_TICK_MS = 30_000;

declare global {
  var __iceSchedulerStarted: boolean | undefined;
  var __iceSchedulerTimer: ReturnType<typeof setInterval> | undefined;
}

function getTickIntervalMs(): number {
  const raw = process.env.SLA_TICK_INTERVAL_MS;
  if (!raw) {
    return DEFAULT_TICK_MS;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TICK_MS;
}

export function startSlaScheduler(): void {
  if (globalThis.__iceSchedulerStarted) {
    return;
  }

  globalThis.__iceSchedulerStarted = true;
  const intervalMs = getTickIntervalMs();
  setSchedulerRuntime(intervalMs, true);

  log("info", "scheduler.started", {
    intervalMs,
    mode: "in-process",
  });

  const tick = async () => {
    const started = Date.now();

    try {
      const { processSlaBreaches } = await import("@/lib/sla/service");
      const { processEscalations } = await import("@/lib/escalation/service");
      const { countOpenSlaOverdue } = await import("@/lib/observability/health");

      const breached = await processSlaBreaches();
      const escalated = await processEscalations();
      const openOverdue = await countOpenSlaOverdue();
      const durationMs = Date.now() - started;

      recordSchedulerTick({
        durationMs,
        breached,
        escalated,
        openOverdue,
      });

      log("info", "scheduler.tick", {
        durationMs,
        breached,
        escalated,
        openOverdue,
      });

      if (breached > 0) {
        log("info", "scheduler.sla_breaches_processed", { count: breached });
      }

      if (escalated > 0) {
        log("info", "scheduler.escalations_processed", { count: escalated });
      }
    } catch (error) {
      recordSchedulerTick({
        durationMs: Date.now() - started,
        breached: 0,
        escalated: 0,
        openOverdue: 0,
        error: true,
      });

      log("error", "scheduler.tick_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  void tick();
  globalThis.__iceSchedulerTimer = setInterval(() => {
    void tick();
  }, intervalMs);
}

export function stopSlaScheduler(): void {
  if (globalThis.__iceSchedulerTimer) {
    clearInterval(globalThis.__iceSchedulerTimer);
    globalThis.__iceSchedulerTimer = undefined;
  }
  globalThis.__iceSchedulerStarted = false;
  setSchedulerRuntime(getTickIntervalMs(), false);
}

export function isSchedulerRunning(): boolean {
  return globalThis.__iceSchedulerStarted === true;
}
