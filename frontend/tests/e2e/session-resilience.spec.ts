import { expect, test } from "@playwright/test";

// The e2e build points NEXT_PUBLIC_BACKEND_URL at the Next server itself
// (see ci.yml), so the client API calls are intercepted on this origin.
const API = "http://127.0.0.1:3100/api/**";

const ADMIN_USER = { email: "admin@example.com", role: "admin" };
const OVERVIEW = {
  tasks: {},
  open_incidents: 0,
  cost_guard: { band: "NORMAL", month_spend_usd: 0, monthly_limit_usd: 10 },
  scheduler: { status: "ready" },
  agents: { status: "ready", registered: [] },
};

async function seedTokens(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("aion-access-token", "access");
    sessionStorage.setItem("aion-refresh-token", "refresh");
  });
}

function storedTokens(page: import("@playwright/test").Page) {
  return page.evaluate(() => [
    sessionStorage.getItem("aion-access-token"),
    sessionStorage.getItem("aion-refresh-token"),
  ]);
}

test("cold start shows a waking state, keeps the tokens and recovers without a new sign in", async ({ page }) => {
  let attempts = 0;
  await seedTokens(page);
  await page.route(API, async (route) => {
    const url = route.request().url();
    if (url.endsWith("/auth/me")) {
      attempts += 1;
      // the first calls answer like the platform edge while the instance wakes up
      if (attempts <= 2) return route.fulfill({ status: 503 });
      return route.fulfill({ json: ADMIN_USER });
    }
    if (url.endsWith("/admin/overview")) return route.fulfill({ json: OVERVIEW });
    return route.fulfill({ status: 404 });
  });

  await page.goto("/admin");
  await expect(page.getByText(/Backend waking up/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry now" })).toBeVisible();
  // a valid session must never be reported as signed out
  await expect(page.getByText("Sign in to view operations.")).toHaveCount(0);

  await expect(page.getByText("NORMAL", { exact: true })).toBeVisible({ timeout: 30_000 });
  expect(attempts).toBeGreaterThan(2);
  expect(await storedTokens(page)).toEqual(["access", "refresh"]);
});

test("the header reconnects instead of offering Sign in while the backend is unreachable", async ({ page }) => {
  await seedTokens(page);
  await page.route(API, (route) => route.fulfill({ status: 503 }));

  await page.goto("/");
  const header = page.locator("header");
  await expect(header.getByText(/Reconnecting/)).toBeVisible();
  await expect(header.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  expect(await storedTokens(page)).toEqual(["access", "refresh"]);
});

test("a rejected session still ends it and clears both tokens", async ({ page }) => {
  await seedTokens(page);
  await page.route(API, (route) => route.fulfill({ status: 401 }));

  await page.goto("/admin");
  await expect(page.getByText(/Your session expired/)).toBeVisible();
  expect(await storedTokens(page)).toEqual([null, null]);
  await page.reload();
  await expect(page.getByText(/Your session expired/)).toBeVisible();
});
