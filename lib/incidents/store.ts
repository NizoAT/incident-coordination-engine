import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/types";
import {
  canAccessIncident,
  incidentVisibilityFilter,
} from "@/lib/auth/rbac";
import { startSlaCycle } from "@/lib/sla/service";

import {
  incidentInclude,
  loadSlaDurationMap,
  slaDurationFor,
  toIncident,
  toIncidentEvent,
} from "./mappers";
import type { Incident, IncidentEvent, IncidentStatus, Severity } from "./types";

async function mapIncidents(
  records: Awaited<ReturnType<typeof prisma.incident.findMany>>,
): Promise<Incident[]> {
  const durations = await loadSlaDurationMap();
  return records.map((record) =>
    toIncident(record, slaDurationFor(durations, record.severity)),
  );
}

export async function listIncidents(user: SessionUser): Promise<Incident[]> {
  const records = await prisma.incident.findMany({
    where: incidentVisibilityFilter(user),
    include: incidentInclude,
    orderBy: { createdAt: "desc" },
  });
  return mapIncidents(records);
}

export async function getIncidentForUser(
  user: SessionUser,
  id: string,
): Promise<Incident | undefined> {
  const record = await prisma.incident.findUnique({
    where: { id },
    include: incidentInclude,
  });

  if (!record || !canAccessIncident(user, record)) {
    return undefined;
  }

  const durations = await loadSlaDurationMap();
  return toIncident(record, slaDurationFor(durations, record.severity));
}

export async function listIncidentEvents(
  incidentId: string,
): Promise<IncidentEvent[]> {
  const records = await prisma.incidentEvent.findMany({
    where: { incidentId },
    orderBy: { timestamp: "asc" },
  });
  return records.map(toIncidentEvent);
}

export async function createIncident(
  user: SessionUser,
  input: {
    title: string;
    description: string;
    severity: Severity;
  },
): Promise<Incident> {
  const incident = await prisma.$transaction(async (tx) => {
    const created = await tx.incident.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        severity: input.severity,
        status: "open",
        createdById: user.id,
      },
      include: incidentInclude,
    });

    await tx.incidentEvent.create({
      data: {
        incidentId: created.id,
        type: "IncidentCreated",
        actorId: user.id,
        metadata: {
          title: created.title,
          severity: created.severity,
        },
        sourceType: null,
        sourceId: null,
      },
    });

    await startSlaCycle(tx, created.id, input.severity, user.id);

    return tx.incident.findUniqueOrThrow({
      where: { id: created.id },
      include: incidentInclude,
    });
  });

  const durations = await loadSlaDurationMap();
  return toIncident(incident, slaDurationFor(durations, incident.severity));
}

export async function updateIncidentStatus(
  user: SessionUser,
  id: string,
  status: IncidentStatus,
): Promise<Incident> {
  const incident = await prisma.$transaction(async (tx) => {
    const current = await tx.incident.findUniqueOrThrow({
      where: { id },
      include: incidentInclude,
    });

    if (!canAccessIncident(user, current)) {
      throw new Error("FORBIDDEN");
    }

    const previousStatus = current.status;

    const updated = await tx.incident.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 },
      },
      include: incidentInclude,
    });

    await tx.incidentEvent.create({
      data: {
        incidentId: id,
        type: "StatusChanged",
        actorId: user.id,
        metadata: {
          from: previousStatus,
          to: status,
        },
        sourceType: null,
        sourceId: null,
      },
    });

    return updated;
  });

  const durations = await loadSlaDurationMap();
  return toIncident(incident, slaDurationFor(durations, incident.severity));
}

export async function updateIncidentSeverity(
  user: SessionUser,
  id: string,
  severity: Severity,
): Promise<Incident> {
  const incident = await prisma.$transaction(async (tx) => {
    const current = await tx.incident.findUniqueOrThrow({
      where: { id },
      include: incidentInclude,
    });

    if (!canAccessIncident(user, current)) {
      throw new Error("FORBIDDEN");
    }

    const previousSeverity = current.severity;

    if (previousSeverity === severity) {
      return current;
    }

    const updated = await tx.incident.update({
      where: { id },
      data: {
        severity,
        version: { increment: 1 },
      },
      include: incidentInclude,
    });

    await tx.incidentEvent.create({
      data: {
        incidentId: id,
        type: "SeverityChanged",
        actorId: user.id,
        metadata: {
          from: previousSeverity,
          to: severity,
        },
        sourceType: null,
        sourceId: null,
      },
    });

    if (updated.status === "open") {
      await startSlaCycle(tx, id, severity, user.id);
    }

    return tx.incident.findUniqueOrThrow({
      where: { id },
      include: incidentInclude,
    });
  });

  const durations = await loadSlaDurationMap();
  return toIncident(incident, slaDurationFor(durations, incident.severity));
}

export async function assignIncident(
  actor: SessionUser,
  incidentId: string,
  assigneeId: string | null,
): Promise<Incident> {
  if (actor.role !== "lead") {
    throw new Error("FORBIDDEN");
  }

  const incident = await prisma.$transaction(async (tx) => {
    const current = await tx.incident.findUniqueOrThrow({
      where: { id: incidentId },
      include: incidentInclude,
    });

    const previousAssigneeId = current.assigneeId;

    if (assigneeId) {
      const assignee = await tx.user.findUnique({ where: { id: assigneeId } });
      if (!assignee || assignee.role !== "responder") {
        throw new Error("Assigné invalide");
      }
    }

    if (previousAssigneeId === assigneeId) {
      return current;
    }

    const updated = await tx.incident.update({
      where: { id: incidentId },
      data: {
        assigneeId,
        version: { increment: 1 },
      },
      include: incidentInclude,
    });

    await tx.incidentEvent.create({
      data: {
        incidentId,
        type: "IncidentAssigned",
        actorId: actor.id,
        metadata: {
          assigneeId,
          previousAssigneeId,
        },
        sourceType: null,
        sourceId: null,
      },
    });

    return updated;
  });

  const durations = await loadSlaDurationMap();
  return toIncident(incident, slaDurationFor(durations, incident.severity));
}
