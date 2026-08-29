import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { linkChangeToIncident } from "@/lib/causality/store";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/types";

describe("linkChangeToIncident (M6)", () => {
  let user: SessionUser;
  let incidentId: string;
  let changeId: string;

  beforeAll(async () => {
    const lead = await prisma.user.findFirstOrThrow({
      where: { email: "lead@demo.local" },
    });
    user = { id: lead.id, email: lead.email, role: "lead" };

    const incident = await prisma.incident.create({
      data: {
        title: "Test M6 causal link",
        severity: "high",
        status: "investigating",
        createdById: lead.id,
      },
    });
    incidentId = incident.id;

    const change = await prisma.change.create({
      data: {
        title: "Deploy checkout v2.4.1",
        externalRef: "CHG-TEST-M6",
        status: "completed",
      },
    });
    changeId = change.id;
  });

  afterAll(async () => {
    await prisma.incidentEvent.deleteMany({ where: { incidentId } });
    await prisma.incidentChange.deleteMany({ where: { incidentId } });
    await prisma.incident.deleteMany({ where: { id: incidentId } });
    await prisma.change.deleteMany({ where: { id: changeId } });
    await prisma.$disconnect();
  });

  it("crée ChangeLinked avec sourceType/sourceId", async () => {
    await linkChangeToIncident(user, incidentId, changeId);

    const event = await prisma.incidentEvent.findFirst({
      where: { incidentId, type: "ChangeLinked" },
    });

    expect(event?.sourceType).toBe("change");
    expect(event?.sourceId).toBe(changeId);

    const metadata = event?.metadata as Record<string, unknown>;
    expect(metadata.changeTitle).toBe("Deploy checkout v2.4.1");
  });
});
