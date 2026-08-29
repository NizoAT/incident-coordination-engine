import { prisma } from "@/lib/db";

import { getMetricsSnapshot } from "./metrics";
import { isSchedulerRunning } from "@/lib/sla/scheduler";

export type HealthStatus = "ok" | "degraded";

export interface DatabaseCheck {
  ok: boolean;
  latencyMs: number | null;
  error?: string;
}

export interface SchedulerCheck {
  ok: boolean;
  running: boolean;
  intervalMs: number;
  lastTickAt: string | null;
  ticksFailedTotal: number;
}

export interface HealthReport {
  status: HealthStatus;
  service: string;
  version: string;
  uptimeSeconds: number;
  checks: {
    database: DatabaseCheck;
    scheduler: SchedulerCheck;
  };
  sla: {
    openOverdueCount: number | null;
  };
}

export function resolveHealthStatus(
  databaseOk: boolean,
  schedulerOk: boolean,
): HealthStatus {
  return databaseOk && schedulerOk ? "ok" : "degraded";
}

export async function checkDatabase(): Promise<DatabaseCheck> {
  const started = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: null,
      error: error instanceof Error ? error.message : "database_unreachable",
    };
  }
}

export async function countOpenSlaOverdue(): Promise<number> {
  return prisma.incident.count({
    where: {
      status: "open",
      slaStatus: "breached",
    },
  });
}

export async function buildHealthReport(): Promise<HealthReport> {
  const database = await checkDatabase();
  const metrics = getMetricsSnapshot();
  const schedulerRunning = isSchedulerRunning();
  const schedulerOk = schedulerRunning;

  let openOverdueCount: number | null = null;
  if (database.ok) {
    openOverdueCount = await countOpenSlaOverdue();
  }

  return {
    status: resolveHealthStatus(database.ok, schedulerOk),
    service: "incident-coordination-engine",
    version: process.env.npm_package_version ?? "0.1.0",
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      database,
      scheduler: {
        ok: schedulerOk,
        running: schedulerRunning,
        intervalMs: metrics.schedulerIntervalMs,
        lastTickAt: metrics.schedulerLastTickAt,
        ticksFailedTotal: metrics.schedulerTicksFailedTotal,
      },
    },
    sla: {
      openOverdueCount,
    },
  };
}
