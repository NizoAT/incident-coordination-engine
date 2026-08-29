import type {
  Incident as PrismaIncident,
  IncidentEvent as PrismaIncidentEvent,
  SlaStatus as PrismaSlaStatus,
} from "@prisma/client";

import type {
  Incident,
  IncidentEvent,
  IncidentEventType,
  SlaStatus,
} from "./types";

type IncidentWithRelations = PrismaIncident & {
  assignee?: { email: string } | null;
  createdBy?: { email: string } | null;
};

function isIncidentEventType(value: string): value is IncidentEventType {
  return (
    value === "IncidentCreated" ||
    value === "SeverityChanged" ||
    value === "StatusChanged" ||
    value === "IncidentAssigned" ||
    value === "SlaStarted" ||
    value === "SlaBreached" ||
    value === "EscalationTriggered" ||
    value === "ChangeLinked" ||
    value === "DeploymentDetected"
  );
}

export function toIncident(
  record: IncidentWithRelations,
  slaDurationMinutes: number | null = null,
): Incident {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    severity: record.severity,
    status: record.status,
    version: record.version,
    assigneeId: record.assigneeId,
    createdById: record.createdById,
    assigneeEmail: record.assignee?.email ?? null,
    createdByEmail: record.createdBy?.email ?? null,
    slaDeadline: record.slaDeadline?.toISOString() ?? null,
    slaStatus: record.slaStatus as SlaStatus,
    slaCycleId: record.slaCycleId,
    slaDurationMinutes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toIncidentEvent(record: PrismaIncidentEvent): IncidentEvent {
  if (!isIncidentEventType(record.type)) {
    throw new Error(`Type d'événement non supporté : ${record.type}`);
  }

  return {
    id: record.id,
    incidentId: record.incidentId,
    type: record.type,
    actorId: record.actorId,
    timestamp: record.timestamp.toISOString(),
    metadata:
      record.metadata !== null &&
      typeof record.metadata === "object" &&
      !Array.isArray(record.metadata)
        ? (record.metadata as Record<string, unknown>)
        : {},
    sourceType: record.sourceType,
    sourceId: record.sourceId,
  };
}

export const incidentInclude = {
  assignee: { select: { email: true } },
  createdBy: { select: { email: true } },
} as const;

export type SlaDurationBySeverity = Map<
  PrismaIncident["severity"],
  number
>;

export async function loadSlaDurationMap(): Promise<SlaDurationBySeverity> {
  const { prisma } = await import("@/lib/db");
  const policies = await prisma.slaPolicy.findMany({
    where: { active: true },
    select: { severity: true, durationMinutes: true },
  });
  return new Map(policies.map((p) => [p.severity, p.durationMinutes]));
}

export function slaDurationFor(
  map: SlaDurationBySeverity,
  severity: PrismaIncident["severity"],
): number | null {
  return map.get(severity) ?? null;
}

export function toStoredSlaStatus(value: PrismaSlaStatus): SlaStatus {
  return value as SlaStatus;
}
