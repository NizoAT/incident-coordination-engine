import { expect, type Page } from "@playwright/test";

/** Comptes créés par `prisma db seed` — local / CI uniquement. */
export const DEMO_LEAD = {
  email: "lead@demo.local",
  password: "demo123",
} as const;

export async function loginAsLead(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEMO_LEAD.email);
  await page.getByLabel("Mot de passe").fill(DEMO_LEAD.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/incidents/);
}
