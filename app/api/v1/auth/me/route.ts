import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api/envelope";
import { resolveApiUser } from "@/lib/auth/api";

export async function GET(request: NextRequest) {
  const user = await resolveApiUser(request);
  if (!user) {
    return apiError(401, "UNAUTHORIZED", "Non authentifié");
  }
  return apiSuccess({ user });
}
