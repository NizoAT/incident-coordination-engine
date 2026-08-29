import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { SessionUser } from "@/lib/auth/types";
import {
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

    const final = await prisma.incident.findUniqueOrThrow({
      where: { id: incidentId },
    });
    expect(final.version).toBe(8);
    expect(final.status).toBe("acknowledged");
  });
});
