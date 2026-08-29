import { afterAll, describe, expect, it } from "vitest";

import { buildHealthReport } from "./health";
import { prisma } from "@/lib/db";

describe("buildHealthReport integration", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("retourne la base de données accessible quand Postgres est disponible", async () => {
    const report = await buildHealthReport();

    expect(report.checks.database.ok).toBe(true);
    expect(report.checks.database.latencyMs).not.toBeNull();
    expect(report.sla.openOverdueCount).toBeTypeOf("number");
    expect(["ok", "degraded"]).toContain(report.status);
  });
});
