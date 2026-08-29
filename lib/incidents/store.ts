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
import type { Incident, IncidentEvent, Severity } from "./types";

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

export interface PaginatedIncidents {
  incidents: Incident[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function listIncidentsPaginated(
  user: SessionUser,
  page: number,
  pageSize: number,
): Promise<PaginatedIncidents> {
  const where = incidentVisibilityFilter(user);
  const total = await prisma.incident.count({ where });
  const records = await prisma.incident.findMany({
    where,
    include: incidentInclude,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  const incidents = await mapIncidents(records);
  return {
    incidents,
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
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
