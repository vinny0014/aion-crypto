import { defineConfig } from "@playwright/test";

// Browser strategy:
// - CI / dev default: Playwright's own bundled Chromium (installed via
//   `npx playwright install --with-deps chromium`) — the supported, stable
//   binary for GitHub runners and workstations.
// - Constrained hosts (e.g. serverless-like environments) may still opt into
//   the @sparticuz/chromium binary by exporting
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH (scripts/run-e2e.mjs prepares it when
//   E2E_USE_SPARTICUZ=1). The Lambda-oriented binary is NOT used by default
//   because it is unstable on ubuntu-latest and caused 180s page/browser
//   setup timeouts in CI.
const sparticuzExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

const launchOptions = sparticuzExecutable
  ? {
      executablePath: sparticuzExecutable,
      args: [
        // trimmed @sparticuz/chromium flags relevant outside Lambda
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--no-sandbox",
        "--disable-gpu",
        "--single-process",
      ],
    }
  : {
      args: ["--disable-dev-shm-usage", "--hide-scrollbars"],
    };

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  fullyParallel: false,
  workers: 1, // serial: the suite shares one Next.js server and one origin
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    launchOptions,
  },
  webServer: {
    command: "HOSTNAME=127.0.0.1 PORT=3100 npm run start",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI, // CI must never attach to a stale server
    timeout: 120_000,
  },
});
