import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/api/envelope";
import { authenticateUser } from "@/lib/auth/credentials";
import { issueApiToken } from "@/lib/auth/jwt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "VALIDATION_ERROR", "JSON invalide");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Données invalides",
    );
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return apiError(401, "UNAUTHORIZED", "Identifiants invalides");
  }

  const token = issueApiToken(user);
  return apiSuccess({ token, user });
}
