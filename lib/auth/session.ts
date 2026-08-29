import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import {
  SESSION_OPTIONS,
  type SessionData,
  type SessionUser,
  assertSessionSecret,
} from "./types";

export async function getSession() {
  assertSessionSecret();
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function setSessionUser(user: SessionUser): Promise<void> {
  const session = await getSession();
  session.user = user;
  await session.save();
}

export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function getSessionFromRequest(
  request: NextRequest,
  response: NextResponse,
) {
  assertSessionSecret();
  return getIronSession<SessionData>(request, response, SESSION_OPTIONS);
}
