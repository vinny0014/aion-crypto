import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

const pageRoutes = [
  "/",
  "/markets",
  "/coins",
  "/crypto/BTC",
  "/explained",
  "/explained/bitcoin",
  "/explained/ethereum",
  "/explained/xrp",
  "/explained/solana",
  "/explained/bnb",
  "/explained/cardano",
  "/explained/crypto-wallet",
  "/explained/bitcoin-etf",
  "/explained/evaluate-cryptocurrency",
  "/explained/stablecoins",
  "/explained/crypto-scams",
  "/guides",
  "/learn",
  "/analysis",
  "/research",
  "/mascot-arena",
  "/news",
  "/search?q=bitcoin",
  "/sources-methodology",
  "/cookie-policy",
  "/watchlist",
  "/login",
  "/admin",
];

const documentRoutes = [
  "/health",
  "/favicon.ico",
  "/icon.svg",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/news-sitemap.xml",
  "/image-sitemap.xml",
  "/rss.xml",
];

test("production routes, SEO identity and responsive layouts", async ({ page, request }) => {
  const errors: string[] = [];
  await page.addInitScript(() => localStorage.setItem("aion-cookie-consent-v2", JSON.stringify({ analytics: false, advertising: false, decidedAt: "2026-08-20T00:00:00.000Z" })));
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "// analytics network isolated in E2E",
  }));
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
  const adsTxt = await request.get("/ads.txt");
  expect(adsTxt.status()).toBe(200);
  expect(adsTxt.headers()["content-type"]).toContain("text/plain");
  expect(await adsTxt.text()).toBe(
    "google.com, pub-3354845222558845, DIRECT, f08c47fec0942fa0\n",
  );
  const legacyFixture = await request.get("/news/bitcoin-etf-flows-institutional-demand");
  expect(legacyFixture.status()).toBe(200);
  expect(legacyFixture.url()).toBe("http://127.0.0.1:3100/news");
  expect((await request.get("/definitely-not-a-real-page")).status()).toBe(404);

  const homeResponse = await page.goto("/");
  expect(homeResponse?.headers()["content-security-policy"]).toContain("default-src 'self'");
  expect(homeResponse?.headers()["content-security-policy"]).toContain("https://www.googletagmanager.com");
  await expect(page).toHaveTitle("AION Crypto — Live Crypto Prices, News and Market Analysis");
  await expect(page.locator('html[lang="en"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aioncrypto.cloud");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Track Bitcoin, Ethereum, XRP and leading cryptocurrencies with live prices, breaking news, market analysis and educational content.",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);
  await expect(page.getByRole("heading", { level: 1, name: "AION Crypto Market Intelligence" })).toBeVisible();
  await expect(page.getByText(/live crypto prices for Bitcoin, Ethereum, XRP/i)).toBeVisible();
  const html = await page.content();
  expect(html).not.toMatch(/aion[ -]?news|wordbet|vercel\.app/i);

  const jsonLd = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.map((script) => JSON.parse(script.textContent || "{}")),
  );
  const website = jsonLd.find((entry) => entry["@type"] === "WebSite");
  const organization = jsonLd.find((entry) => entry["@type"] === "Organization");
  const webPage = jsonLd.find((entry) => entry["@type"] === "WebPage");
  expect(website).toMatchObject({ name: "AION Crypto", alternateName: "AION Crypto Market Intelligence", url: "https://aioncrypto.cloud/" });
  expect(organization).toMatchObject({ name: "AION Crypto", url: "https://aioncrypto.cloud/" });
  expect(organization.logo.url).toBe("https://aioncrypto.cloud/aion-crypto-logo.svg");
  expect(webPage).toMatchObject({ name: "AION Crypto — Live Crypto Prices, News and Market Analysis", url: "https://aioncrypto.cloud/" });

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toContain("Disallow: /login");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://aioncrypto.cloud</loc>");
  expect((await request.get("/aion-crypto-logo.svg")).status()).toBe(200);
  expect((await request.get("/favicon.ico")).headers()["content-type"]).toContain("image/svg+xml");
  expect((await request.get("/icon.svg")).headers()["content-type"]).toContain("image/svg+xml");
  const webManifest = await (await request.get("/manifest.webmanifest")).json();
  expect(webManifest).toMatchObject({ name: "AION Crypto", start_url: "/", theme_color: "#6d28d9" });
  await expect(page.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveCount(1);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  const newsSitemap = await (await request.get("/news-sitemap.xml")).text();
  expect(newsSitemap).not.toContain("<news:news>");
  const homeHtml = await (await request.get("/")).text();
  expect(homeHtml).not.toContain("bitcoin-etf-flows-institutional-demand");
  const homeNewsHrefs = await page.locator('main a[href^="/news/"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")).filter(Boolean),
  );
  expect(new Set(homeNewsHrefs).size, `duplicate rendered home news links: ${JSON.stringify(homeNewsHrefs)}`).toBe(homeNewsHrefs.length);

  await page.goto("/coins", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Prices are the start, not the whole story" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open market hub" })).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Read explainer" })).toHaveCount(3);
  const coinAccessibility = await new AxeBuilder({ page }).analyze();
  expect(coinAccessibility.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);

  await page.goto("/explained/bitcoin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "What Is Bitcoin?" })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://aioncrypto.cloud/explained/bitcoin");
  const explainedJsonLd = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent || "{}")));
  expect(explainedJsonLd.some((entry) => entry["@type"] === "Article" && entry.headline === "What Is Bitcoin?")).toBe(true);
  expect(sitemap).toContain("<loc>https://aioncrypto.cloud/explained/bitcoin</loc>");

  for (const [slug, title] of [
    ["bitcoin", "What Is Bitcoin?"],
    ["ethereum", "What Is Ethereum?"],
    ["xrp", "What Is XRP?"],
    ["solana", "What Is Solana?"],
    ["bnb", "What Is BNB?"],
    ["cardano", "What Is Cardano?"],
  ] as const) {
    errors.length = 0;
    const guideResponse = await page.goto(`/explained/${slug}`, { waitUntil: "domcontentloaded" });
    expect(guideResponse?.status(), slug).toBe(200);
    expect(guideResponse?.headers()["cache-control"], slug).toMatch(/(?:no-store|no-cache)/);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("Reviewed by the AION Crypto editorial desk", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Primary references" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Frequently asked questions" })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://aioncrypto.cloud/explained/${slug}`);
    const guideJsonLd = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent || "{}")));
    expect(guideJsonLd.some((entry) => entry["@type"] === "Article" && entry.headline === title), slug).toBe(true);
    expect(guideJsonLd.some((entry) => entry["@type"] === "BreadcrumbList"), slug).toBe(true);
    expect(guideJsonLd.some((entry) => entry["@type"] === "FAQPage"), slug).toBe(true);
    expect(errors, slug).toEqual([]);
  }

  await page.goto("/explained", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Read the guide →" })).toHaveCount(23);
  await page.goto("/explained/evaluate-cryptocurrency", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 2, name: "Primary references" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Frequently asked questions" })).toBeVisible();
  const qualityJsonLd = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.map((script) => JSON.parse(script.textContent || "{}")));
  expect(qualityJsonLd.some((entry) => entry["@type"] === "BreadcrumbList")).toBe(true);
  expect(qualityJsonLd.some((entry) => entry["@type"] === "FAQPage")).toBe(true);
  expect(sitemap).toContain("<loc>https://aioncrypto.cloud/explained/evaluate-cryptocurrency</loc>");
  expect(sitemap).not.toContain("<loc>https://aioncrypto.cloud/categories</loc>");
  expect(sitemap).not.toContain("<loc>https://aioncrypto.cloud/tags</loc>");
  expect(sitemap).not.toContain("<loc>https://aioncrypto.cloud/status</loc>");
  expect(sitemap).not.toContain("<loc>https://aioncrypto.cloud/newsletter</loc>");
  expect(sitemap).not.toContain("<loc>https://aioncrypto.cloud/crypto/DOGE</loc>");

  await page.goto("/mascot-arena", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Battle for the Crown" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Weekly Top 15" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(15);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /bitcoin-viking-king-v2\.webp/);
  const arenaAccessibility = await new AxeBuilder({ page }).analyze();
  expect(arenaAccessibility.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/mascot-arena", { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);

  await page.goto("/");

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
  await expect(page.getByText("NORMAL", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("NORMAL", { exact: true })).toBeVisible();
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
