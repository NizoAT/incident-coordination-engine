import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { authenticateUser } from "@/lib/auth/credentials";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

const TEST_EMAIL = "auth-test@demo.local";
const TEST_PASSWORD = "integration-test-password";

describe("authenticateUser (integration)", () => {
  beforeAll(async () => {
    const passwordHash = await hashPassword(TEST_PASSWORD);
    await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      update: { passwordHash, role: "responder" },
      create: {
        email: TEST_EMAIL,
        passwordHash,
        role: "responder",
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  });

  it("returns a session user for valid credentials", async () => {
    const user = await authenticateUser(TEST_EMAIL, TEST_PASSWORD);

    expect(user).not.toBeNull();
    expect(user?.email).toBe(TEST_EMAIL);
    expect(user?.role).toBe("responder");
    expect(user?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("returns null for an invalid password", async () => {
    const user = await authenticateUser(TEST_EMAIL, "wrong-password");
    expect(user).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    const user = await authenticateUser("nobody@demo.local", TEST_PASSWORD);
    expect(user).toBeNull();
  });
});
