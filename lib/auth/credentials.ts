import { prisma } from "@/lib/db";

import { verifyPassword } from "./password";
import type { SessionUser } from "./types";

export async function authenticateUser(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function listAssignableUsers() {
  return prisma.user.findMany({
    where: { role: "responder" },
    orderBy: { email: "asc" },
    select: { id: true, email: true },
  });
}
