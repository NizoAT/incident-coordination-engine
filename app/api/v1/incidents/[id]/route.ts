import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api/envelope";
import { runPatchIncident } from "@/lib/api/incident-errors";
import { resolveApiUser } from "@/lib/auth/api";
import { getIncidentForUser } from "@/lib/incidents/store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await resolveApiUser(request);
  if (!user) {
    return apiError(401, "UNAUTHORIZED", "Non authentifié");
  }

  const { id } = await context.params;
  const incident = await getIncidentForUser(user, id);
  if (!incident) {
    return apiError(404, "NOT_FOUND", "Incident introuvable");
  }

  return apiSuccess({ incident });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await resolveApiUser(request);
  if (!user) {
    return apiError(401, "UNAUTHORIZED", "Non authentifié");
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "VALIDATION_ERROR", "JSON invalide");
  }

  const result = await runPatchIncident(user, id, body);
  if (!result.ok) {
    return result.response;
  }

  return apiSuccess({ incident: result.incident });
}
