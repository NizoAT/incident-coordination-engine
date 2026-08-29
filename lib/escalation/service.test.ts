import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildIdempotencyKey } from "@/domain/escalation/idempotency";
import { tryEscalateIncident } from "@/lib/escalation/service";
import { prisma } from "@/lib/db";

describe("escalation RELEASE scenarios", () => {
  let incidentId: string;
  let policyId: string;
  let escalationWindowId: string;

  beforeAll(async () => {
    const lead = await prisma.user.findFirstOrThrow({
      where: { email: "lead@demo.local" },
    });

    const policy = await prisma.escalationPolicy.findFirstOrThrow({
      where: { severity: "critical", active: true },
    });
    policyId = policy.id;
    escalationWindowId = crypto.randomUUID();

    const incident = await prisma.incident.create({
      data: {
        title: "Test RELEASE #1 critical sans ack",
        description: "Integration test M5",
        severity: "critical",
        status: "open",
        slaStatus: "breached",
        slaCycleId: escalationWindowId,
        slaDeadline: new Date(Date.now() - 60_000),
        createdById: lead.id,
      },
    });
    incidentId = incident.id;

    await prisma.incidentEvent.create({
      data: {
        incidentId,
        type: "SlaBreached",
        metadata: {
          slaCycleId: escalationWindowId,
          escalationWindowId,
          deadline: new Date(Date.now() - 60_000).toISOString(),
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.notificationLog.deleteMany({
      where: { delivery: { incidentId } },
    });
    await prisma.escalationDelivery.deleteMany({ where: { incidentId } });
    await prisma.incidentEvent.deleteMany({ where: { incidentId } });
    await prisma.incident.deleteMany({ where: { id: incidentId } });
    await prisma.$disconnect();
  });

  it("scenario 1 — critical open + SLA breached → escalade envoyée", async () => {
    const escalated = await tryEscalateIncident(incidentId);
    expect(escalated).toBe(true);

    const delivery = await prisma.escalationDelivery.findUnique({
      where: {
        idempotencyKey: buildIdempotencyKey(
          incidentId,
          policyId,
          escalationWindowId,
        ),
      },
    });

    expect(delivery?.status).toBe("sent");

    const event = await prisma.incidentEvent.findFirst({
      where: { incidentId, type: "EscalationTriggered" },
    });
    expect(event).not.toBeNull();

    const logs = await prisma.notificationLog.count({
      where: { delivery: { incidentId } },
    });
    expect(logs).toBeGreaterThan(0);
  });

  it("scenario 2 — job dupliqué même idempotencyKey → une seule delivery sent", async () => {
    const before = await prisma.escalationDelivery.count({
      where: { incidentId, status: "sent" },
    });

    const [first, second] = await Promise.all([
      tryEscalateIncident(incidentId),
      tryEscalateIncident(incidentId),
    ]);

    expect(first).toBe(false);
    expect(second).toBe(false);

    const after = await prisma.escalationDelivery.count({
      where: { incidentId, status: "sent" },
    });
    expect(after).toBe(before);
    expect(after).toBe(1);
  });
});
