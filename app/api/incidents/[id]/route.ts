import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  PatchForbiddenError,
  PatchNotFoundError,
  VersionConflictError,
  patchIncident,
} from "@/lib/incidents/patch";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  try {
    const incident = await patchIncident(user, id, body as never);
    return NextResponse.json({ incident });
  } catch (error) {
    if (error instanceof VersionConflictError) {
      return NextResponse.json(
        {
          error: "Conflit de version: rechargez l'incident et réessayez",
          code: "VERSION_CONFLICT",
        },
        { status: 409 },
      );
    }
    if (error instanceof PatchForbiddenError) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    if (error instanceof PatchNotFoundError) {
      return NextResponse.json({ error: "Incident introuvable" }, { status: 404 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
