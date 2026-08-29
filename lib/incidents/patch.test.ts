import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { SessionUser } from "@/lib/auth/types";
import {
  PatchForbiddenError,
  VersionConflictError,
  patchIncident,
} from "@/lib/incidents/patch";
import { prisma } from "@/lib/db";

describe("patchIncident optimistic locking (RELEASE scenario 3)", () => {
  let incidentId: string;
  let user: SessionUser;

  beforeAll(async () => {
    const lead = await prisma.user.findFirstOrThrow({
      where: { email: "lead@demo.local" },
    });

    user = { id: lead.id, email: lead.email, role: "lead" };

    const incident = await prisma.incident.create({
      data: {
        title: "Test RELEASE #3 concurrence PATCH",
        description: "version lock",
        severity: "medium",
        status: "open",
        version: 7,
        createdById: lead.id,
      },
    });
    incidentId = incident.id;
  });

  afterAll(async () => {
    await prisma.incidentEvent.deleteMany({ where: { incidentId } });
    await prisma.incident.deleteMany({ where: { id: incidentId } });
    await prisma.$disconnect();
  });

  it("deux PATCH concurrents sur version 7 → un succès, un 409", async () => {
    const results = await Promise.allSettled([
      patchIncident(user, incidentId, { version: 7, status: "acknowledged" }),
      patchIncident(user, incidentId, { version: 7, status: "acknowledged" }),
    ]);

    const successes = results.filter((r) => r.status === "fulfilled");
    const conflicts = results.filter(
      (r) =>
        r.status === "rejected" &&
        r.reason instanceof VersionConflictError,
    );

    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(1);
    const conflict = (conflicts[0] as PromiseRejectedResult)
      .reason as VersionConflictError;
    expect(conflict.details?.expectedVersion).toBe(7);
    expect(conflict.details?.currentVersion).toBe(8);

    const final = await prisma.incident.findUniqueOrThrow({
      where: { id: incidentId },
    });
    expect(final.version).toBe(8);
    expect(final.status).toBe("acknowledged");
  });

  it("responder ne peut pas PATCH assigneeId (lead only)", async () => {
    const responder = await prisma.user.findFirstOrThrow({
      where: { email: "responder@demo.local" },
    });
    const responderUser: SessionUser = {
      id: responder.id,
      email: responder.email,
      role: "responder",
    };

    await patchIncident(user, incidentId, {
      version: 8,
      assigneeId: responder.id,
    });

    await expect(
      patchIncident(responderUser, incidentId, {
        version: 9,
        assigneeId: null,
      }),
    ).rejects.toBeInstanceOf(PatchForbiddenError);
  });
});

describe("patchIncident RBAC status (P2 M3 prérequis)", () => {
  let lead: SessionUser;
  let responder: SessionUser;
  let otherResponder: SessionUser;
  const ids: string[] = [];

  beforeAll(async () => {
    const leadRecord = await prisma.user.findFirstOrThrow({
      where: { email: "lead@demo.local" },
    });
    const responderRecord = await prisma.user.findFirstOrThrow({
      where: { email: "responder@demo.local" },
    });

    lead = {
      id: leadRecord.id,
      email: leadRecord.email,
      role: "lead",
    };
    responder = {
      id: responderRecord.id,
      email: responderRecord.email,
      role: "responder",
    };

    // Second responder : seed peut n'en avoir qu'un → créer jetable si besoin
    let other = await prisma.user.findFirst({
      where: {
        role: "responder",
        id: { not: responderRecord.id },
      },
    });
    if (!other) {
      other = await prisma.user.create({
        data: {
          email: "responder-rbac-temp@demo.local",
          passwordHash: responderRecord.passwordHash,
          role: "responder",
        },
      });
    }
    otherResponder = {
      id: other.id,
      email: other.email,
      role: "responder",
    };
  });

  afterAll(async () => {
    if (ids.length > 0) {
      await prisma.incidentEvent.deleteMany({
        where: { incidentId: { in: ids } },
      });
      await prisma.incident.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.user.deleteMany({
      where: { email: "responder-rbac-temp@demo.local" },
    });
    await prisma.$disconnect();
  });

  it("responder peut PATCH status sur incident qui lui est assigné", async () => {
    const incident = await prisma.incident.create({
      data: {
        title: "RBAC ack assigné",
        description: "P2 M3 prérequis",
        severity: "high",
        status: "open",
        version: 1,
        createdById: lead.id,
        assigneeId: responder.id,
      },
    });
    ids.push(incident.id);

    const updated = await patchIncident(responder, incident.id, {
      version: 1,
      status: "acknowledged",
    });

    expect(updated.status).toBe("acknowledged");
    expect(updated.version).toBe(2);
    expect(updated.assigneeId).toBe(responder.id);
  });

  it("responder ne peut pas PATCH status sur incident ni assigné ni créé par lui", async () => {
    const incident = await prisma.incident.create({
      data: {
        title: "RBAC ack interdit",
        description: "P2 M3 prérequis",
        severity: "medium",
        status: "open",
        version: 1,
        createdById: lead.id,
        assigneeId: otherResponder.id,
      },
    });
    ids.push(incident.id);

    await expect(
      patchIncident(responder, incident.id, {
        version: 1,
        status: "acknowledged",
      }),
    ).rejects.toBeInstanceOf(PatchForbiddenError);

    const unchanged = await prisma.incident.findUniqueOrThrow({
      where: { id: incident.id },
    });
    expect(unchanged.status).toBe("open");
    expect(unchanged.version).toBe(1);
  });
});
