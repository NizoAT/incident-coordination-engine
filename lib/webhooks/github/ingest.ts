import { Prisma } from "@prisma/client";

import { buildGitHubIdempotencyKey } from "@/lib/webhooks/github/signature";
import {
  type GitHubDeploymentStatusPayload,
  mapGitHubDeploymentState,
  parseIncidentIdFromClientPayload,
} from "@/lib/webhooks/github/schema";
import { prisma } from "@/lib/db";
import { toDeployment } from "@/lib/causality/mappers";
import type { Deployment } from "@/lib/causality/types";

export class DuplicateWebhookError extends Error {
  constructor(public readonly idempotencyKey: string) {
    super("DUPLICATE_WEBHOOK");
    this.name = "DuplicateWebhookError";
  }
}

export class NonTerminalDeploymentStateError extends Error {
  constructor(public readonly state: string) {
    super("NON_TERMINAL_STATE");
    this.name = "NonTerminalDeploymentStateError";
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function ingestGitHubDeploymentStatus(
  deliveryId: string,
  payload: GitHubDeploymentStatusPayload,
): Promise<{ created: boolean; deployment: Deployment; linkedIncidentId?: string }> {
  const terminalStatus = mapGitHubDeploymentState(payload.deployment_status.state);
  if (!terminalStatus) {
    throw new NonTerminalDeploymentStateError(payload.deployment_status.state);
  }

  const idempotencyKey = buildGitHubIdempotencyKey(deliveryId);
  const incidentId = parseIncidentIdFromClientPayload(payload.deployment.payload);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deployment = await tx.deployment.create({
        data: {
          version: payload.deployment.ref,
          environment: payload.deployment.environment,
          status: terminalStatus,
          source: "github",
          idempotencyKey,
          githubDeploymentId: String(payload.deployment.id),
          deployedAt: new Date(payload.deployment_status.created_at),
        },
        include: { change: { select: { title: true } } },
      });

      let linkedIncidentId: string | undefined;

      if (incidentId) {
        const incident = await tx.incident.findUnique({ where: { id: incidentId } });
        if (incident) {
          await tx.incidentDeployment.create({
            data: {
              incidentId,
              deploymentId: deployment.id,
            },
          });

          await tx.incidentEvent.create({
            data: {
              incidentId,
              type: "DeploymentDetected",
              actorId: null,
              metadata: {
                deploymentId: deployment.id,
                version: deployment.version,
                environment: deployment.environment,
                status: deployment.status,
                source: "github",
                deliveryId,
                githubDeploymentId: payload.deployment.id,
              },
              sourceType: "deployment",
              sourceId: deployment.id,
            },
          });

          linkedIncidentId = incidentId;
        }
      }

      return { deployment, linkedIncidentId };
    });

    return {
      created: true,
      deployment: toDeployment(result.deployment),
      linkedIncidentId: result.linkedIncidentId,
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await prisma.deployment.findUnique({
        where: { idempotencyKey },
        include: { change: { select: { title: true } } },
      });
      if (!existing) {
        throw new DuplicateWebhookError(idempotencyKey);
      }
      return {
        created: false,
        deployment: toDeployment(existing),
      };
    }
    throw error;
  }
}
