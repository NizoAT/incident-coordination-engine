import { Prisma } from "@prisma/client";
import { z } from "zod";

import type { SessionUser } from "@/lib/auth/types";
import { canAccessIncident } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import {
  incidentInclude,
  loadSlaDurationMap,
  slaDurationFor,
  toIncident,
} from "@/lib/incidents/mappers";
import { startSlaCycle } from "@/lib/sla/service";
import {
  assertSeverityChange,
  assertTransition,
} from "@/lib/incidents/transitions";
import type { Incident, IncidentStatus, Severity } from "@/lib/incidents/types";

export class VersionConflictError extends Error {
  constructor() {
    super("VERSION_CONFLICT");
    this.name = "VersionConflictError";
  }
}

export class PatchForbiddenError extends Error {
  constructor() {
    super("FORBIDDEN");
    this.name = "PatchForbiddenError";
  }
}

export class PatchNotFoundError extends Error {
  constructor() {
    super("NOT_FOUND");
    this.name = "PatchNotFoundError";
  }
}

const patchIncidentSchema = z
  .object({
    version: z.number().int().positive(),
    status: z
      .enum(["open", "acknowledged", "investigating", "resolved"])
      .optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  })
  .refine((data) => data.status != null || data.severity != null, {
    message: "Au moins status ou severity requis",
  });

export type PatchIncidentInput = z.infer<typeof patchIncidentSchema>;

export async function patchIncident(
  user: SessionUser,
  id: string,
  input: PatchIncidentInput,
): Promise<Incident> {
  const parsed = patchIncidentSchema.parse(input);

  const incident = await prisma.$transaction(async (tx) => {
    const current = await tx.incident.findUnique({
      where: { id },
      include: incidentInclude,
    });

    if (!current) {
      throw new PatchNotFoundError();
    }

    if (!canAccessIncident(user, current)) {
      throw new PatchForbiddenError();
    }

    if (current.version !== parsed.version) {
      throw new VersionConflictError();
    }

    let nextStatus: IncidentStatus | undefined = parsed.status;
    let nextSeverity: Severity | undefined = parsed.severity;

    if (nextStatus != null) {
      assertTransition(current.status, nextStatus);
    }

    if (nextSeverity != null) {
      assertSeverityChange(current.status);
    }

    if (nextStatus === current.status) {
      nextStatus = undefined;
    }

    if (nextSeverity === current.severity) {
      nextSeverity = undefined;
    }

    if (nextStatus == null && nextSeverity == null) {
      return current;
    }

    try {
      const updated = await tx.incident.update({
        where: { id, version: parsed.version },
        data: {
          ...(nextStatus != null ? { status: nextStatus } : {}),
          ...(nextSeverity != null ? { severity: nextSeverity } : {}),
          version: { increment: 1 },
        },
        include: incidentInclude,
      });

      if (nextStatus != null) {
        await tx.incidentEvent.create({
          data: {
            incidentId: id,
            type: "StatusChanged",
            actorId: user.id,
            metadata: { from: current.status, to: nextStatus },
            sourceType: null,
            sourceId: null,
          },
        });
      }

      if (nextSeverity != null) {
        await tx.incidentEvent.create({
          data: {
            incidentId: id,
            type: "SeverityChanged",
            actorId: user.id,
            metadata: { from: current.severity, to: nextSeverity },
            sourceType: null,
            sourceId: null,
          },
        });

        if (updated.status === "open") {
          await startSlaCycle(tx, id, nextSeverity, user.id);
        }
      }

      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new VersionConflictError();
      }
      throw error;
    }
  });

  const durations = await loadSlaDurationMap();
  return toIncident(incident, slaDurationFor(durations, incident.severity));
}
