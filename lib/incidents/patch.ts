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
  readonly details?: { expectedVersion: number; currentVersion: number };
  readonly currentIncident?: Incident;

  constructor(options?: {
    details?: { expectedVersion: number; currentVersion: number };
    currentIncident?: Incident;
  }) {
    super("VERSION_CONFLICT");
    this.name = "VersionConflictError";
    this.details = options?.details;
    this.currentIncident = options?.currentIncident;
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

export class PatchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PatchValidationError";
  }
}

const patchIncidentSchema = z
  .object({
    version: z.number().int().positive(),
    status: z
      .enum(["open", "acknowledged", "investigating", "resolved"])
      .optional(),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    assigneeId: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.status != null ||
      data.severity != null ||
      data.assigneeId !== undefined,
    { message: "Au moins status, severity ou assigneeId requis" },
  );

export type PatchIncidentInput = z.infer<typeof patchIncidentSchema>;

async function mapRecordToIncident(
  record: NonNullable<Awaited<ReturnType<typeof prisma.incident.findUnique>>> & {
    assignee?: { email: string } | null;
    createdBy?: { email: string } | null;
  },
): Promise<Incident> {
  const durations = await loadSlaDurationMap();
  return toIncident(record, slaDurationFor(durations, record.severity));
}

async function throwVersionConflict(
  id: string,
  expectedVersion: number,
): Promise<never> {
  const current = await prisma.incident.findUnique({
    where: { id },
    include: incidentInclude,
  });

  if (!current) {
    throw new PatchNotFoundError();
  }

  throw new VersionConflictError({
    details: {
      expectedVersion,
      currentVersion: current.version,
    },
    currentIncident: await mapRecordToIncident(current),
  });
}

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
      throw new VersionConflictError({
        details: {
          expectedVersion: parsed.version,
          currentVersion: current.version,
        },
        currentIncident: await mapRecordToIncident(current),
      });
    }

    let nextStatus: IncidentStatus | undefined = parsed.status;
    let nextSeverity: Severity | undefined = parsed.severity;
    let nextAssigneeId: string | null | undefined = parsed.assigneeId;

    if (nextStatus != null) {
      assertTransition(current.status, nextStatus);
    }

    if (nextSeverity != null) {
      assertSeverityChange(current.status);
    }

    if (nextAssigneeId !== undefined) {
      if (user.role !== "lead") {
        throw new PatchForbiddenError();
      }

      if (nextAssigneeId) {
        const assignee = await tx.user.findUnique({
          where: { id: nextAssigneeId },
        });
        if (!assignee || assignee.role !== "responder") {
          throw new PatchValidationError("Assigné invalide");
        }
      }
    }

    if (nextStatus === current.status) {
      nextStatus = undefined;
    }

    if (nextSeverity === current.severity) {
      nextSeverity = undefined;
    }

    if (nextAssigneeId !== undefined && nextAssigneeId === current.assigneeId) {
      nextAssigneeId = undefined;
    }

    if (
      nextStatus == null &&
      nextSeverity == null &&
      nextAssigneeId === undefined
    ) {
      return current;
    }

    const previousAssigneeId = current.assigneeId;

    try {
      const updated = await tx.incident.update({
        where: { id, version: parsed.version },
        data: {
          ...(nextStatus != null ? { status: nextStatus } : {}),
          ...(nextSeverity != null ? { severity: nextSeverity } : {}),
          ...(nextAssigneeId !== undefined ? { assigneeId: nextAssigneeId } : {}),
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

      if (nextAssigneeId !== undefined) {
        await tx.incidentEvent.create({
          data: {
            incidentId: id,
            type: "IncidentAssigned",
            actorId: user.id,
            metadata: {
              assigneeId: nextAssigneeId,
              previousAssigneeId,
            },
            sourceType: null,
            sourceId: null,
          },
        });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        await throwVersionConflict(id, parsed.version);
      }
      throw error;
    }
  });

  return mapRecordToIncident(incident);
}
