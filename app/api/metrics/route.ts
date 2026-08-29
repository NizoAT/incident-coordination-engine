import { NextRequest, NextResponse } from "next/server";

import { formatPrometheusMetrics } from "@/lib/observability/http";
import { getMetricsSnapshot } from "@/lib/observability/metrics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");

  if (format === "prometheus") {
    return new NextResponse(formatPrometheusMetrics(), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      },
    });
  }

  return NextResponse.json(getMetricsSnapshot());
}
