const DEFAULT_TICK_MS = 30_000;

let schedulerStarted = false;
let tickTimer: ReturnType<typeof setInterval> | null = null;

function getTickIntervalMs(): number {
  const raw = process.env.SLA_TICK_INTERVAL_MS;
  if (!raw) {
    return DEFAULT_TICK_MS;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TICK_MS;
}

export function startSlaScheduler(): void {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;
  const intervalMs = getTickIntervalMs();

  const tick = async () => {
    try {
      const { processSlaBreaches } = await import("@/lib/sla/service");
      const { processEscalations } = await import("@/lib/escalation/service");

      const breached = await processSlaBreaches();
      if (breached > 0) {
        console.info(`[ice-scheduler] ${breached} SLA breach(es)`);
      }

      const escalated = await processEscalations();
      if (escalated > 0) {
        console.info(`[ice-scheduler] ${escalated} escalation(s) envoyée(s)`);
      }
    } catch (error) {
      console.error("[ice-scheduler] tick failed", error);
    }
  };

  void tick();
  tickTimer = setInterval(() => {
    void tick();
  }, intervalMs);

  console.info(
    `[ice-scheduler] démarré — intervalle ${intervalMs}ms (SLA + escalade, in-process)`,
  );
}

export function stopSlaScheduler(): void {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  schedulerStarted = false;
}
