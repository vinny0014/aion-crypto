import { expect, test } from "@playwright/test";

const EXPECTED_SHA = (process.env.AION_EXPECTED_SHA ?? "").trim().toLowerCase();
const BACKEND_URL = (process.env.AION_BACKEND_URL ?? "https://aion-crypto-api.onrender.com").replace(/\/$/, "");
const REQUIRE_ADSENSE_SCRIPT = process.env.AION_REQUIRE_ADSENSE_SCRIPT !== "false";

const pillars = [
  ["bitcoin", "What Is Bitcoin?"],
  ["ethereum", "What Is Ethereum?"],
  ["xrp", "What Is XRP?"],
  ["solana", "What Is Solana?"],
  ["bnb", "What Is BNB?"],
  ["cardano", "What Is Cardano?"],
] as const;

test("release fingerprints and AdSense public prerequisites are live", async ({ request }) => {
  const buildInfoResponse = await request.get("/build-info.json", { headers: { "cache-control": "no-cache" } });
  expect(buildInfoResponse.status()).toBe(200);
  const buildInfo = await buildInfoResponse.json();
  expect(buildInfo.app).toBe("AION Crypto");
  expect(buildInfo.sha).toMatch(/^[0-9a-f]{7,40}$/);
  if (EXPECTED_SHA) expect(buildInfo.sha).toBe(EXPECTED_SHA);

  const readyResponse = await request.get(`${BACKEND_URL}/health/ready`, { headers: { "cache-control": "no-cache" } });
  expect(readyResponse.status()).toBe(200);
  const ready = await readyResponse.json();
  expect(ready).toMatchObject({ status: "ready", database: "ok", coordination_dispatch_retry: true });
  if (EXPECTED_SHA) expect(ready.release_sha).toBe(EXPECTED_SHA);

  const ads = await request.get("/ads.txt", { headers: { "cache-control": "no-cache" } });
  expect(ads.status()).toBe(200);
  expect(ads.headers()["content-type"]).toContain("text/plain");
  expect(await ads.text()).toBe("google.com, pub-3354845222558845, DIRECT, f08c47fec0942fa0\n");

  const sitemap = await request.get("/sitemap.xml", { headers: { "cache-control": "no-cache" } });
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  for (const [slug] of pillars) expect(sitemapText).toContain(`<loc>https://aioncrypto.cloud/explained/${slug}</loc>`);

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Allow: /");
});

test("home and six pillars render cleanly on desktop and mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  for (const [width, height] of [[1440, 1000], [390, 844]] as const) {
    await page.setViewportSize({ width, height });
    errors.length = 0;
    const home = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(home?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "AION Crypto Market Intelligence" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(errors, `home ${width}px`).toEqual([]);

    for (const [slug, title] of pillars) {
      errors.length = 0;
      const response = await page.goto(`/explained/${slug}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), slug).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page.getByText("Reviewed by the AION Crypto editorial desk", { exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Primary references" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: "Frequently asked questions" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${slug} ${width}px`).toBeLessThanOrEqual(width);
      expect(errors, `${slug} ${width}px`).toEqual([]);
    }
  }

  for (const width of [360, 390, 412]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `home overflow ${width}px`).toBeLessThanOrEqual(width);
  }
});

test("Consent Mode blocks Google before choice and enables loaders only after consent", async ({ page }) => {
  await page.route(/googletagmanager\.com/, (route) => route.fulfill({ contentType: "application/javascript", body: "// isolated by production preflight" }));
  await page.route(/googlesyndication\.com/, (route) => route.fulfill({ contentType: "application/javascript", body: "// isolated by production preflight" }));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog", { name: "Your privacy choices" })).toBeVisible();
  await page.waitForFunction(() => typeof (window as typeof window & { gtag?: unknown }).gtag === "function");

  const before = await page.evaluate(() => (window as typeof window & { dataLayer?: IArguments[] }).dataLayer?.map((entry) => Array.from(entry)) ?? []);
  expect(before).toContainEqual(["consent", "default", expect.objectContaining({
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  })]);
  expect(before.some((command) => command[0] === "event" && command[1] === "page_view")).toBe(false);
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
  await expect(page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Accept all" }).click();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(1);
  if (REQUIRE_ADSENSE_SCRIPT) {
    await expect(page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')).toHaveCount(1);
    await expect(page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')).toHaveAttribute("src", /ca-pub-3354845222558845/);
  }
});

test("representative production pages keep CLS below 0.1", async ({ page }) => {
  await page.addInitScript(() => {
    (window as typeof window & { __aionCls?: number }).__aionCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
        if (!shift.hadRecentInput) {
          const w = window as typeof window & { __aionCls?: number };
          w.__aionCls = (w.__aionCls ?? 0) + shift.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  for (const route of ["/", "/explained/bitcoin", "/explained/solana", "/mascot-arena"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const cls = await page.evaluate(() => (window as typeof window & { __aionCls?: number }).__aionCls ?? 0);
    expect(cls, `${route} CLS=${cls}`).toBeLessThan(0.1);
  }
});
