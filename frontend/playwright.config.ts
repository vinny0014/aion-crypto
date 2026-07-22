import { defineConfig } from "@playwright/test";
import chromium from "@sparticuz/chromium";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath) throw new Error("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is required");
chromium.setGraphicsMode = true;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath,
      args: [...chromium.args, "--disable-dev-shm-usage", "--hide-scrollbars"],
    },
  },
  webServer: {
    command: "HOSTNAME=127.0.0.1 PORT=3100 npm run start",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
