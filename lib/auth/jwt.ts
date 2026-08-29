import { createHmac, timingSafeEqual } from "node:crypto";

import type { SessionUser, UserRole } from "./types";

const DEFAULT_TTL_SECONDS = 86_400;

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signSegment(secret: string, header: string, payload: string): string {
  return createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
}

export function assertApiJwtSecret(): string {
  const secret = process.env.API_JWT_SECRET ?? process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "API_JWT_SECRET manquant ou trop court (minimum 32 caractères).",
    );
  }
  return secret;
}

export function getApiJwtTtlSeconds(): number {
  const raw = process.env.API_JWT_TTL_SECONDS;
  if (!raw) {
    return DEFAULT_TTL_SECONDS;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_SECONDS;
}

export function issueApiToken(user: SessionUser): string {
  const secret = assertApiJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + getApiJwtTtlSeconds(),
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signSegment(secret, header, encodedPayload);
  return `${header}.${encodedPayload}.${signature}`;
}

export function verifyApiToken(token: string): SessionUser | null {
  let secret: string;
  try {
    secret = assertApiJwtSecret();
  } catch {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, encodedPayload, signature] = parts;
  const expected = signSegment(secret, header, encodedPayload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || !payload.email || !payload.role || payload.exp <= now) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}
