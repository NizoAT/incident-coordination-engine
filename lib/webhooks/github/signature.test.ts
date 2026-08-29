import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { buildGitHubIdempotencyKey, verifyGitHubSignature } from "@/lib/webhooks/github/signature";

describe("verifyGitHubSignature", () => {
  const secret = "test-webhook-secret";
  const body = '{"action":"created"}';

  it("accepts a valid sha256 HMAC", () => {
    const sig =
      "sha256=" +
      createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyGitHubSignature(body, sig, secret)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(verifyGitHubSignature(body, "sha256=deadbeef", secret)).toBe(false);
  });
});

describe("buildGitHubIdempotencyKey", () => {
  it("prefixes delivery id with github namespace", () => {
    expect(buildGitHubIdempotencyKey("abc-123")).toBe("github:abc-123");
  });
});
