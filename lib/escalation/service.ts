import { Prisma } from "@prisma/client";

import {
  buildIdempotencyKey,
  isEligibleForEscalation,
} from "@/domain/escalation/idempotency";
import { prisma } from "@/lib/db";

type TransactionClient = Prisma.TransactionClient;

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function notifyLeadsInTx(
  tx: TransactionClient,
  deliveryId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const leads = await tx.user.findMany({
    where: { role: "lead" },
    select: { id: true, email: true },
  });

  for (const lead of leads) {
    const message = {
      channel: "log",
      to: lead.email,
      toUserId: lead.id,
      ...payload,
    };
    console.info("[escalation-notify]", JSON.stringify(message));

    await tx.notificationLog.create({
      data: {
        escalationDeliveryId: deliveryId,
        channel: "log",
        payload: message,
      },
    });
  }
}

export async function tryEscalateIncident(incidentId: string): Promise<boolean> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    select: {
      id: true,
      title: true,
      severity: true,
      status: true,
      slaStatus: true,
      slaCycleId: true,
    },
  });

  if (
    !incident ||
    !isEligibleForEscalation(incident.status) ||
    incident.slaStatus !== "breached" ||
    !incident.slaCycleId
  ) {
    return false;
  }

  const policy = await prisma.escalationPolicy.findFirst({
    where: { severity: incident.severity, active: true },
  });

  if (!policy) {
    return false;
  }

  const escalationWindowId = incident.slaCycleId;
  const idempotencyKey = buildIdempotencyKey(
    incident.id,
    policy.id,
    escalationWindowId,
  );

  try {
    return await prisma.$transaction(async (tx) => {
      const delivery = await tx.escalationDelivery.create({
        data: {
          incidentId: incident.id,
          policyId: policy.id,
          escalationWindowId,
          idempotencyKey,
          status: "pending",
        },
      });

      await notifyLeadsInTx(tx, delivery.id, {
        incidentId: incident.id,
        incidentTitle: incident.title,
        severity: incident.severity,
        policyId: policy.id,
        escalationWindowId,
        idempotencyKey,
        notifyRole: policy.notifyRole,
      });

      await tx.escalationDelivery.update({
        where: { id: delivery.id },
        data: { status: "sent", sentAt: new Date() },
      });

      await tx.incidentEvent.create({
        data: {
          incidentId: incident.id,
          type: "EscalationTriggered",
          actorId: null,
          metadata: {
            policyId: policy.id,
            notifyRole: policy.notifyRole,
            escalationWindowId,
            idempotencyKey,
          },
          sourceType: null,
          sourceId: null,
        },
      });

      return true;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return false;
    }
    throw error;
  }
}

export async function processEscalations(): Promise<number> {
  const candidates = await prisma.incident.findMany({
    where: {
      status: "open",
      slaStatus: "breached",
      slaCycleId: { not: null },
    },
    select: { id: true },
  });

  let escalatedCount = 0;

  for (const { id } of candidates) {
    const escalated = await tryEscalateIncident(id);
    if (escalated) {
      escalatedCount += 1;
    }
  }

  return escalatedCount;
}
