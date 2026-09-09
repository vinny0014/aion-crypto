import { defineConfig } from "@playwright/test";

const baseURL = process.env.AION_PRODUCTION_URL ?? "https://aioncrypto.cloud";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report-production" }],
    ["json", { outputFile: "test-results/adsense-production-preflight.json" }],
  ],
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: false,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    launchOptions: {
      args: ["--disable-dev-shm-usage", "--hide-scrollbars"],
    },
  },
});
