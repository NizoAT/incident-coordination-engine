import { NextResponse } from "next/server";

import { buildHealthReport } from "@/lib/observability/health";
import { log } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await buildHealthReport();
  const statusCode = report.status === "ok" ? 200 : 503;

  if (report.status === "degraded") {
    log("warn", "health.degraded", {
      databaseOk: report.checks.database.ok,
      schedulerOk: report.checks.scheduler.ok,
    });
  }

  return NextResponse.json(report, { status: statusCode });
}
