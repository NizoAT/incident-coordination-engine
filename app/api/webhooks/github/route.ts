import { NextRequest, NextResponse } from "next/server";

import {
  DuplicateWebhookError,
  NonTerminalDeploymentStateError,
  ingestGitHubDeploymentStatus,
} from "@/lib/webhooks/github/ingest";
import { githubDeploymentStatusSchema } from "@/lib/webhooks/github/schema";
import { verifyGitHubSignature } from "@/lib/webhooks/github/signature";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "GITHUB_WEBHOOK_SECRET non configuré" },
      { status: 503 },
    );
  }

  const deliveryId = request.headers.get("x-github-delivery");
  const event = request.headers.get("x-github-event");
  const signature = request.headers.get("x-hub-signature-256");

  if (!deliveryId || !event) {
    return NextResponse.json(
      { error: "Headers GitHub manquants" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  if (!verifyGitHubSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  if (event !== "deployment_status") {
    return NextResponse.json({ ignored: true, event }, { status: 202 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = githubDeploymentStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const result = await ingestGitHubDeploymentStatus(deliveryId, parsed.data);

    if (!result.created) {
      return NextResponse.json(
        {
          duplicate: true,
          deliveryId,
          deployment: result.deployment,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        created: true,
        deliveryId,
        deployment: result.deployment,
        linkedIncidentId: result.linkedIncidentId ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof NonTerminalDeploymentStateError) {
      return NextResponse.json(
        { ignored: true, state: error.state },
        { status: 202 },
      );
    }
    if (error instanceof DuplicateWebhookError) {
      return NextResponse.json(
        { duplicate: true, idempotencyKey: error.idempotencyKey },
        { status: 200 },
      );
    }
    throw error;
  }
}
