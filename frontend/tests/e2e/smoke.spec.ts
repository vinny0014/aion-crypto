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
