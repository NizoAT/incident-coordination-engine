import type {
  Change as PrismaChange,
  Deployment as PrismaDeployment,
} from "@prisma/client";

import type { Change, Deployment } from "./types";

export function toChange(record: PrismaChange): Change {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    externalRef: record.externalRef,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

type DeploymentWithChange = PrismaDeployment & {
  change?: { title: string } | null;
};

export function toDeployment(record: DeploymentWithChange): Deployment {
  return {
    id: record.id,
    changeId: record.changeId,
    changeTitle: record.change?.title ?? null,
    version: record.version,
    environment: record.environment,
    status: record.status,
    source: record.source,
    idempotencyKey: record.idempotencyKey,
    githubDeploymentId: record.githubDeploymentId,
    deployedAt: record.deployedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}
