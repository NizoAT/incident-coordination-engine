import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import { ingestGitHubDeploymentStatus } from "@/lib/webhooks/github/ingest";
import type { GitHubDeploymentStatusPayload } from "@/lib/webhooks/github/schema";
import { prisma } from "@/lib/db";

const payload: GitHubDeploymentStatusPayload = {
  action: "created",
  deployment: {
    id: 999001,
    ref: "v9.9.9-test",
    environment: "staging",
    payload: null,
  },
  deployment_status: {
    id: 888001,
    state: "success",
    created_at: new Date().toISOString(),
  },
};

describe("ingestGitHubDeploymentStatus (M7 idempotence)", () => {
  const deliveryId = `test-delivery-${randomUUID()}`;

  afterAll(async () => {
    await prisma.deployment.deleteMany({
      where: { idempotencyKey: `github:${deliveryId}` },
    });
    await prisma.$disconnect();
  });

  it("crée un déploiement au premier appel", async () => {
    const result = await ingestGitHubDeploymentStatus(deliveryId, payload);
    expect(result.created).toBe(true);
    expect(result.deployment.source).toBe("github");
    expect(result.deployment.version).toBe("v9.9.9-test");
  });

  it("ignore proprement un webhook dupliqué (même delivery id)", async () => {
    const result = await ingestGitHubDeploymentStatus(deliveryId, payload);
    expect(result.created).toBe(false);
    expect(result.deployment.idempotencyKey).toBe(`github:${deliveryId}`);

    const count = await prisma.deployment.count({
      where: { idempotencyKey: `github:${deliveryId}` },
    });
    expect(count).toBe(1);
  });
});
