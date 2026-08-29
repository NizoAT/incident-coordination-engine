import type { Prisma, Severity } from "@prisma/client";

import {
  SlaPolicyNotFoundError,
  calculateSlaDeadline,
  isEligibleForSlaBreach,
} from "@/domain/sla/deadline";
import { prisma } from "@/lib/db";
import type {
  IncidentStatus,
  Severity as DomainSeverity,
} from "@/lib/incidents/types";

type TransactionClient = Prisma.TransactionClient;

export async function getActiveSlaPolicy(
  severity: DomainSeverity,
  tx: TransactionClient = prisma,
) {
  return tx.slaPolicy.findFirst({
    where: { severity, active: true },
  });
}

export async function getActiveSlaPolicyOrThrow(
  severity: DomainSeverity,
  tx: TransactionClient = prisma,
) {
  const policy = await getActiveSlaPolicy(severity, tx);
  if (!policy) {
    throw new SlaPolicyNotFoundError(severity);
  }
  return policy;
}

export async function startSlaCycle(
  tx: TransactionClient,
  incidentId: string,
  severity: DomainSeverity,
  actorId: string | null,
): Promise<{ deadline: Date; policyId: string; slaCycleId: string }> {
  const policy = await getActiveSlaPolicyOrThrow(severity, tx);
  const startedAt = new Date();
  const deadline = calculateSlaDeadline(startedAt, policy.durationMinutes);
  const slaCycleId = crypto.randomUUID();

  await tx.incident.update({
    where: { id: incidentId },
    data: {
      slaDeadline: deadline,
      slaStatus: "ok",
      slaCycleId,
    },
  });

  await tx.incidentEvent.create({
    data: {
      incidentId,
      type: "SlaStarted",
      actorId,
      metadata: {
        deadline: deadline.toISOString(),
        policyId: policy.id,
        slaCycleId,
        durationMinutes: policy.durationMinutes,
      },
      sourceType: null,
      sourceId: null,
    },
  });

  return { deadline, policyId: policy.id, slaCycleId };
}

async function hasSlaBreachedForCycle(
  tx: TransactionClient,
  incidentId: string,
  slaCycleId: string,
): Promise<boolean> {
  const existing = await tx.incidentEvent.findFirst({
    where: {
      incidentId,
      type: "SlaBreached",
      metadata: {
        path: ["slaCycleId"],
        equals: slaCycleId,
      },
    },
  });
  return existing != null;
}

export async function breachIncidentSla(
  tx: TransactionClient,
  incident: {
    id: string;
    slaDeadline: Date | null;
    slaCycleId: string | null;
    severity: Severity;
    status: IncidentStatus;
  },
): Promise<boolean> {
  if (
    !incident.slaDeadline ||
    !incident.slaCycleId ||
    !isEligibleForSlaBreach(incident.status)
  ) {
    return false;
  }

  const now = new Date();
  if (now.getTime() < incident.slaDeadline.getTime()) {
    return false;
  }

  const alreadyBreached = await hasSlaBreachedForCycle(
    tx,
    incident.id,
    incident.slaCycleId,
  );
  if (alreadyBreached) {
    return false;
  }

  const policy = await getActiveSlaPolicy(incident.severity as DomainSeverity, tx);

  await tx.incident.update({
    where: { id: incident.id },
    data: { slaStatus: "breached" },
  });

  await tx.incidentEvent.create({
    data: {
      incidentId: incident.id,
      type: "SlaBreached",
      actorId: null,
      metadata: {
        deadline: incident.slaDeadline.toISOString(),
        breachedAt: now.toISOString(),
        slaCycleId: incident.slaCycleId,
        escalationWindowId: incident.slaCycleId,
        policyId: policy?.id ?? null,
      },
      sourceType: null,
      sourceId: null,
    },
  });

  return true;
}

export async function processSlaBreaches(): Promise<number> {
  const now = new Date();

  const candidates = await prisma.incident.findMany({
    where: {
      status: "open",
      slaDeadline: { lt: now },
      slaStatus: { not: "breached" },
      slaCycleId: { not: null },
    },
    select: {
      id: true,
      slaDeadline: true,
      slaCycleId: true,
      severity: true,
      status: true,
    },
  });

  let breachedCount = 0;

  for (const incident of candidates) {
    const breached = await prisma.$transaction((tx) =>
      breachIncidentSla(tx, incident),
    );
    if (breached) {
      breachedCount += 1;
    }
  }

  return breachedCount;
}
