import { expect, test } from "@playwright/test";

import { loginAsLead } from "./fixtures/auth";

test.describe("parcours critique — incident + SLA", () => {
  test("lead se connecte, crée un incident et voit le SLA actif", async ({
    page,
  }) => {
    await loginAsLead(page);

    const title = `E2E SLA ${Date.now()}`;
    await page.getByLabel("Titre").fill(title);
    await page.getByLabel("Description").fill("Parcours Playwright M14");

    await page.getByRole("button", { name: "Créer l'incident" }).click();

    await expect(page).toHaveURL(/\/incidents\/.+/);
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();

    const slaSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "SLA" }),
    });
    await expect(slaSection).toBeVisible();
    await expect(
      slaSection.getByText(/Dans les temps|Échéance proche/),
    ).toBeVisible();
    await expect(slaSection.getByText("Échéance :")).toBeVisible();

    await page.getByRole("link", { name: "← Retour à la liste" }).click();
    const row = page.getByRole("link").filter({ hasText: title });
    await expect(row).toBeVisible();
    await expect(
      row.getByText(/Dans les temps|Échéance proche/),
    ).toBeVisible();
  });
});
