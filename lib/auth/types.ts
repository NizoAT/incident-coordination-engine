export type UserRole = "responder" | "lead";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface SessionData {
  user?: SessionUser;
}

export const SESSION_COOKIE = "ice_session";

export const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? "",
  cookieName: SESSION_COOKIE,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

export function assertSessionSecret(): void {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET manquant ou trop court (minimum 32 caractères).",
    );
  }
}
