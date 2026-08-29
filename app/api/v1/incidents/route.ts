import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api/envelope";
import { parsePagination } from "@/lib/api/pagination";
import { resolveApiUser } from "@/lib/auth/api";
import { listIncidentsPaginated } from "@/lib/incidents/store";

export async function GET(request: NextRequest) {
  const user = await resolveApiUser(request);
  if (!user) {
    return apiError(401, "UNAUTHORIZED", "Non authentifié");
  }

  const { page, pageSize } = parsePagination(request.nextUrl.searchParams);
  const result = await listIncidentsPaginated(user, page, pageSize);

  return apiSuccess(result.incidents, 200, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
}
