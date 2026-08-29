import { NextRequest, NextResponse } from "next/server";

import { runPatchIncident } from "@/lib/api/incident-errors";
import { getCurrentUser } from "@/lib/auth/session";

/** @deprecated Préférer PATCH /api/v1/incidents/{id} */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Non authentifié",
        },
      },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "JSON invalide",
        },
      },
      { status: 400 },
    );
  }

  const result = await runPatchIncident(user, id, body);
  if (!result.ok) {
    return result.response;
  }

  return NextResponse.json({ data: { incident: result.incident } });
}
