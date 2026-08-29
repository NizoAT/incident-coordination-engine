import { expect, test } from "@playwright/test";

import { loginAsLead } from "./fixtures/auth";

test.describe("parcours critique: post-mortem", () => {
  test("lead consulte la timeline causale et les liens d'export", async ({
    page,
  }) => {
    await loginAsLead(page);

    await page
      .getByRole("link", { name: /Indisponibilité totale checkout/ })
      .click();

    await expect(page).toHaveURL(/\/incidents\/.+/);
    await expect(
      page.getByRole("heading", {
        name: "Timeline post-mortem (M8)",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Export JSON" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Export Markdown" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Causale/ })).toBeVisible();
  });
});
