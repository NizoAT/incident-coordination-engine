import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const PORT =
  process.env.PORT ?? (process.env.CI === "true" ? "3001" : "3099");
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

const useProductionServer =
  process.env.CI === "true" ||
  process.env.PLAYWRIGHT_USE_START === "1" ||
  existsSync(".next/BUILD_ID");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: useProductionServer
      ? `npm run start -- -p ${PORT}`
      : `npm run dev -- -p ${PORT}`,
    url: `${baseURL}/login`,
    reuseExistingServer:
      !process.env.CI &&
      process.env.PLAYWRIGHT_USE_START !== "1" &&
      !useProductionServer,
    timeout: 120_000,
  },
});
