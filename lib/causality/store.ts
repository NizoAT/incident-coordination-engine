import { Prisma } from "@prisma/client";

import type { SessionUser } from "@/lib/auth/types";
import { canAccessIncident } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { incidentInclude } from "@/lib/incidents/mappers";

import { toChange, toDeployment } from "./mappers";
import type {
  Change,
  ChangeStatus,
  Deployment,
  DeploymentStatus,
  LinkedChange,
  LinkedDeployment,
} from "./types";

export async function listChanges(): Promise<Change[]> {
  const records = await prisma.change.findMany({
    orderBy: { createdAt: "desc" },
  });
  return records.map(toChange);
}

export async function createChange(input: {
  title: string;
  description?: string;
  externalRef?: string;
  status?: ChangeStatus;
}): Promise<Change> {
  const record = await prisma.change.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      externalRef: input.externalRef?.trim() || null,
      status: input.status ?? "planned",
    },
  });
  return toChange(record);
}

export async function listLinkedChanges(
  incidentId: string,
): Promise<LinkedChange[]> {
  const links = await prisma.incidentChange.findMany({
    where: { incidentId },
    include: { change: true },
    orderBy: { linkedAt: "asc" },
  });

  return links.map((link) => ({
    change: toChange(link.change),
    linkedAt: link.linkedAt.toISOString(),
  }));
}

export async function listLinkedDeployments(
  incidentId: string,
): Promise<LinkedDeployment[]> {
  const links = await prisma.incidentDeployment.findMany({
    where: { incidentId },
    include: {
      deployment: { include: { change: { select: { title: true } } } },
    },
    orderBy: { linkedAt: "asc" },
  });

  return links.map((link) => ({
    deployment: toDeployment(link.deployment),
    linkedAt: link.linkedAt.toISOString(),
  }));
}

export async function listUnlinkedChangesForIncident(
  incidentId: string,
): Promise<Change[]> {
  const linked = await prisma.incidentChange.findMany({
    where: { incidentId },
    select: { changeId: true },
  });
  const linkedIds = linked.map((l) => l.changeId);

  const records = await prisma.change.findMany({
    where: linkedIds.length > 0 ? { id: { notIn: linkedIds } } : undefined,
    orderBy: { title: "asc" },
  });

  return records.map(toChange);
}

export class ChangeAlreadyLinkedError extends Error {
  constructor() {
    super("CHANGE_ALREADY_LINKED");
    this.name = "ChangeAlreadyLinkedError";
  }
}

export async function linkChangeToIncident(
  user: SessionUser,
  incidentId: string,
  changeId: string,
): Promise<LinkedChange> {
  const result = await prisma.$transaction(async (tx) => {
    const incident = await tx.incident.findUniqueOrThrow({
      where: { id: incidentId },
      include: incidentInclude,
    });

    if (!canAccessIncident(user, incident)) {
      throw new Error("FORBIDDEN");
    }

    const change = await tx.change.findUniqueOrThrow({ where: { id: changeId } });

    const existing = await tx.incidentChange.findUnique({
      where: { incidentId_changeId: { incidentId, changeId } },
    });
    if (existing) {
      throw new ChangeAlreadyLinkedError();
    }

    const link = await tx.incidentChange.create({
      data: {
        incidentId,
        changeId,
        linkedById: user.id,
      },
      include: { change: true },
    });

    await tx.incident.update({
      where: { id: incidentId },
      data: { version: { increment: 1 } },
    });

    await tx.incidentEvent.create({
      data: {
        incidentId,
        type: "ChangeLinked",
        actorId: user.id,
        metadata: {
          changeId: change.id,
          changeTitle: change.title,
          externalRef: change.externalRef,
        },
        sourceType: "change",
        sourceId: change.id,
      },
    });

    return link;
  });

  return {
    change: toChange(result.change),
    linkedAt: result.linkedAt.toISOString(),
  };
}

export async function registerDeploymentForIncident(
  user: SessionUser,
  incidentId: string,
  input: {
    version: string;
    environment: string;
    status: DeploymentStatus;
    changeId?: string | null;
    deployedAt?: Date;
  },
): Promise<LinkedDeployment> {
  const result = await prisma.$transaction(async (tx) => {
    const incident = await tx.incident.findUniqueOrThrow({
      where: { id: incidentId },
      include: incidentInclude,
    });

    if (!canAccessIncident(user, incident)) {
      throw new Error("FORBIDDEN");
    }

    if (input.changeId) {
      await tx.change.findUniqueOrThrow({ where: { id: input.changeId } });
    }

    const deployment = await tx.deployment.create({
      data: {
        version: input.version.trim(),
        environment: input.environment.trim(),
        status: input.status,
        source: "manual",
        changeId: input.changeId ?? null,
        deployedAt: input.deployedAt ?? new Date(),
      },
      include: { change: { select: { title: true } } },
    });

    const link = await tx.incidentDeployment.create({
      data: {
        incidentId,
        deploymentId: deployment.id,
        linkedById: user.id,
      },
    });

    await tx.incident.update({
      where: { id: incidentId },
      data: { version: { increment: 1 } },
    });

    await tx.incidentEvent.create({
      data: {
        incidentId,
        type: "DeploymentDetected",
        actorId: user.id,
        metadata: {
          deploymentId: deployment.id,
          version: deployment.version,
          environment: deployment.environment,
          status: deployment.status,
          changeId: deployment.changeId,
        },
        sourceType: "deployment",
        sourceId: deployment.id,
      },
    });

    return { deployment, link };
  });

  return {
    deployment: toDeployment(result.deployment),
    linkedAt: result.link.linkedAt.toISOString(),
  };
}

export async function getChange(id: string): Promise<Change | undefined> {
  const record = await prisma.change.findUnique({ where: { id } });
  return record ? toChange(record) : undefined;
}

export async function listDeployments(): Promise<Deployment[]> {
  const records = await prisma.deployment.findMany({
    include: { change: { select: { title: true } } },
    orderBy: { deployedAt: "desc" },
  });
  return records.map(toDeployment);
}

export async function listDeploymentsForChange(
  changeId: string,
): Promise<Deployment[]> {
  const records = await prisma.deployment.findMany({
    where: { changeId },
    include: { change: { select: { title: true } } },
    orderBy: { deployedAt: "desc" },
  });
  return records.map(toDeployment);
}

export function isUniqueLinkViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
