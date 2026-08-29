import { ZodError } from "zod";

import {
  PatchForbiddenError,
  PatchNotFoundError,
  PatchValidationError,
  VersionConflictError,
  patchIncident,
  type PatchIncidentInput,
} from "@/lib/incidents/patch";
import {
  SeverityChangeError,
  TransitionError,
} from "@/lib/incidents/transitions";
import type { SessionUser } from "@/lib/auth/types";

import { apiError } from "./envelope";

export async function runPatchIncident(
  user: SessionUser,
  id: string,
  body: unknown,
) {
  try {
    const incident = await patchIncident(user, id, body as PatchIncidentInput);
    return { ok: true as const, incident };
  } catch (error) {
    return { ok: false as const, response: mapPatchIncidentError(error, id) };
  }
}

export function mapPatchIncidentError(error: unknown, _incidentId?: string) {
  if (error instanceof VersionConflictError) {
    return apiError(
      409,
      "VERSION_CONFLICT",
      "Conflit de version: rechargez l'incident et réessayez",
      error.details,
      error.currentIncident ? { incident: error.currentIncident } : undefined,
    );
  }
  if (error instanceof PatchForbiddenError) {
    return apiError(403, "FORBIDDEN", "Accès refusé");
  }
  if (error instanceof PatchNotFoundError) {
    return apiError(404, "NOT_FOUND", "Incident introuvable");
  }
  if (error instanceof TransitionError || error instanceof SeverityChangeError) {
    return apiError(422, "UNPROCESSABLE_ENTITY", error.message);
  }
  if (error instanceof PatchValidationError) {
    return apiError(422, "UNPROCESSABLE_ENTITY", error.message);
  }
  if (error instanceof ZodError) {
    return apiError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Données invalides");
  }
  if (error instanceof Error) {
    return apiError(400, "VALIDATION_ERROR", error.message);
  }
  return apiError(500, "INTERNAL_ERROR", "Erreur interne");
}

export function mapIncidentReadError(error: unknown) {
  if (error instanceof PatchNotFoundError) {
    return apiError(404, "NOT_FOUND", "Incident introuvable");
  }
  if (error instanceof PatchForbiddenError) {
    return apiError(403, "FORBIDDEN", "Accès refusé");
  }
  return apiError(500, "INTERNAL_ERROR", "Erreur interne");
}
