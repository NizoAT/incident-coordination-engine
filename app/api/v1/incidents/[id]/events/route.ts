import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api/envelope";
import { resolveApiUser } from "@/lib/auth/api";
import { getIncidentForUser, listIncidentEvents } from "@/lib/incidents/store";

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

  const events = await listIncidentEvents(id);
  return apiSuccess({ events });
}
