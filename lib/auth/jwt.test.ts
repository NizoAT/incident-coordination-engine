import { describe, expect, it } from "vitest";

import { issueApiToken, verifyApiToken } from "./jwt";
import type { SessionUser } from "./types";

const user: SessionUser = {
  id: "user-1",
  email: "lead@demo.local",
  role: "lead",
};

describe("issueApiToken / verifyApiToken", () => {
  it("émet et vérifie un JWT valide", () => {
    process.env.API_JWT_SECRET = "test-api-jwt-secret-32-characters-min";
    const token = issueApiToken(user);
    const resolved = verifyApiToken(token);
    expect(resolved).toEqual(user);
  });

  it("rejette un token altéré", () => {
    process.env.API_JWT_SECRET = "test-api-jwt-secret-32-characters-min";
    const token = issueApiToken(user);
    const resolved = verifyApiToken(`${token}x`);
    expect(resolved).toBeNull();
  });
});
