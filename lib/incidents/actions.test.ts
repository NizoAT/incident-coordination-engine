import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/lib/auth/types";
import { advanceStatusFormAction } from "@/lib/incidents/actions";
import { patchIncident } from "@/lib/incidents/patch";
import { prisma } from "@/lib/db";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { getCurrentUser } = vi.hoisted(() => ({
  getCurrentUser: vi.fn<() => Promise<SessionUser | null>>(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser,
}));

describe("advanceStatusFormAction (web, RELEASE scenario 3)", () => {
  let incidentId: string;
  let user: SessionUser;

  beforeAll(async () => {
    const lead = await prisma.user.findFirstOrThrow({
      where: { email: "lead@demo.local" },
    });

    user = { id: lead.id, email: lead.email, role: "lead" };
    getCurrentUser.mockResolvedValue(user);

    const incident = await prisma.incident.create({
      data: {
        title: "Test web action version stale",
        description: "no silent overwrite",
        severity: "low",
        status: "open",
        version: 10,
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

  it("version périmée → erreur utilisateur, pas d'écrasement silencieux", async () => {
    await patchIncident(user, incidentId, {
      version: 10,
      status: "acknowledged",
    });

    const formData = new FormData();
    formData.set("id", incidentId);
    formData.set("version", "10");
    formData.set("status", "investigating");

    await expect(advanceStatusFormAction(formData)).rejects.toThrow(
      "Conflit de version: un autre client a modifié l'incident. Rechargez la page.",
    );

    const final = await prisma.incident.findUniqueOrThrow({
      where: { id: incidentId },
    });
    expect(final.version).toBe(11);
    expect(final.status).toBe("acknowledged");
  });
});
