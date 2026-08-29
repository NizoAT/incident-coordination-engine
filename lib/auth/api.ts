import type { NextRequest } from "next/server";

import { getCurrentUser } from "./session";
import type { SessionUser } from "./types";
import { verifyApiToken } from "./jwt";

export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function resolveApiUser(
  request: NextRequest,
): Promise<SessionUser | null> {
  const bearer = extractBearerToken(request);
  if (bearer) {
    return verifyApiToken(bearer);
  }
  return getCurrentUser();
}
