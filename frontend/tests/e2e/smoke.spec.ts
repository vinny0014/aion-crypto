import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

const pageRoutes = [
  "/",
  "/markets",
  "/crypto/BTC",
  "/news",
  "/news/bitcoin-etf-flows-institutional-demand",
  "/search?q=bitcoin",
  "/watchlist",
  "/login",
  "/admin",
];

const documentRoutes = [
  "/health",
  "/robots.txt",
  "/sitemap.xml",
  "/news-sitemap.xml",
  "/image-sitemap.xml",
  "/rss.xml",
];

test("production preview routes, SEO lock and responsive layouts", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const route of pageRoutes) {
    errors.length = 0;
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    expect(errors, route).toEqual([]);
  }

  for (const route of documentRoutes) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
  }

  const homeResponse = await page.goto("/");
  expect(homeResponse?.headers()["content-security-policy"]).toContain("default-src 'self'");
  await expect(page).toHaveTitle(/AION Crypto/);
  await expect(page.locator('html[lang="en"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aioncrypto.cloud");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const html = await page.content();
  expect(html).not.toMatch(/aion[ -]?news|wordbet|vercel\.app/i);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /");
  const newsSitemap = await (await request.get("/news-sitemap.xml")).text();
  expect(newsSitemap).not.toContain("<news:news>");

  const accessibility = await new AxeBuilder({ page }).analyze();
  const blockers = accessibility.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => ({ id: violation.id, nodes: violation.nodes.length }));
  expect(blockers).toEqual([]);

  const output = path.resolve(process.cwd(), "../docs/screenshots");
  for (const [name, width, height] of [
    ["desktop-1440", 1440, 1000],
    ["tablet-768", 768, 1024],
    ["mobile-390", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    const viewport = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, className: element.className, left: rect.left, right: rect.right };
        })
        .filter((element) => element.left < -0.5 || element.right > window.innerWidth + 0.5)
        .slice(0, 8),
    }));
    expect(viewport.innerWidth, name).toBe(width);
    expect(viewport.scrollWidth, `${name} horizontal overflow: ${JSON.stringify(viewport.offenders)}`).toBeLessThanOrEqual(width);
    await page.screenshot({ path: path.join(output, `aion-crypto-${name}.png`), fullPage: true });
  }
});

test("verified admin session persists across reload and logout clears protected access", async ({ page }) => {
  let signedOut = false;
  await page.addInitScript(() => {
    sessionStorage.setItem("aion-access-token", "access");
    sessionStorage.setItem("aion-refresh-token", "refresh");
  });
  await page.route("http://127.0.0.1:3100/api/**", async (route) => {
    const url = route.request().url();
    if (url.endsWith("/auth/me")) return route.fulfill(signedOut ? { status: 401 } : { json: { email: "admin@example.com", role: "admin" } });
    if (url.endsWith("/admin/overview")) return route.fulfill({ json: { tasks: {}, open_incidents: 0, cost_guard: { band: "NORMAL", month_spend_usd: 0, monthly_limit_usd: 10 }, scheduler: { status: "ready" }, agents: { status: "ready", registered: [] } } });
    if (url.endsWith("/auth/logout")) { signedOut = true; return route.fulfill({ status: 204 }); }
    return route.fulfill({ status: 404 });
  });
  await page.goto("/admin");
  await expect(page.getByText("Operations dashboard")).toBeVisible();
  await expect(page.getByText("NORMAL")).toBeVisible();
  await page.reload();
  await expect(page.getByText("NORMAL")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/admin");
  await expect(page.getByText("Sign in to view operations.")).toBeVisible();
});

test("login verifies backend access and authenticated watchlist removes through the API", async ({ page }) => {
  let symbols = ["BTC", "ETH"];
  await page.route("http://127.0.0.1:3100/api/**", async (route) => {
    const request = route.request();
    const url = request.url();
    if (url.endsWith("/auth/login")) return route.fulfill({ json: { access_token: "access", refresh_token: "refresh" } });
    if (url.endsWith("/auth/me")) return route.fulfill({ json: { email: "admin@example.com", role: "admin" } });
    if (url.endsWith("/watchlist") && request.method() === "GET") return route.fulfill({ json: { data: symbols.map((symbol, position) => ({ symbol, position })) } });
    if (url.endsWith("/watchlist/BTC") && request.method() === "DELETE") { symbols = symbols.filter((symbol) => symbol !== "BTC"); return route.fulfill({ status: 204 }); }
    return route.fulfill({ status: 404 });
  });
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("s3cret!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Signed in. Your account access was verified.")).toBeVisible();
  await page.goto("/watchlist");
  await expect(page.getByText("Saved to your account and synced across sessions.")).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).first().click();
  await expect(page.getByText(/Bitcoin BTC/)).toHaveCount(0);
  expect(symbols).toEqual(["ETH"]);
});

test("watchlist remains local for a visitor and falls back transparently when account API fails", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("aion-crypto-watchlist", JSON.stringify(["BTC"])));
  await page.route("http://127.0.0.1:3100/api/**", (route) => route.fulfill({ status: 503 }));
  await page.goto("/watchlist");
  await expect(page.getByText("Saved locally in this browser. Sign in to sync across devices.")).toBeVisible();
  await expect(page.getByText(/Bitcoin BTC/)).toBeVisible();
});
