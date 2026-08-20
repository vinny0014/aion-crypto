import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SYMBOLS = [
  "BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK",
  "AVAX", "DOT", "SHIB", "PEPE", "HYPE", "TRX", "SUI",
] as const;

const ARENA_API = "**/api/v1/mascot-arena";

function arenaState() {
  const publishedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const ranking = SYMBOLS.map((symbol, index) => ({
    symbol,
    coin: symbol,
    title: `The ${symbol} Contender`,
    position: index + 1,
    votes: SYMBOLS.length - index,
    percentage: Number((((SYMBOLS.length - index) / 120) * 100).toFixed(1)),
    movement: 0,
    latest_news: { slug: `latest-${symbol.toLowerCase()}`, title: `Latest verified ${symbol} story`, published_at: publishedAt },
  }));
  return {
    round: {
      id: 1,
      week: "2026-W33",
      starts_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      total_votes: 120,
    },
    champion: ranking[0],
    mascot_of_week: null,
    ranking,
    hall_of_fame: [],
    next_challenger: { symbol: "TON", coin: "Toncoin", title: "The Network Voyager" },
    last_rotation: {
      relegated: { symbol: "UNI", coin: "Uniswap", title: "The Liquidity Alchemist" },
      promoted: { symbol: "SUI", coin: "Sui", title: "The Tidal Blade" },
      week: "2026-W32",
    },
    can_vote: true,
    next_vote_at: null,
  };
}

async function mockArena(page: Page) {
  await page.route(ARENA_API, (route) => route.fulfill({ json: arenaState() }));
}

test("Arena loads 15 verified stories through one aggregate request", async ({ page }) => {
  const arenaRequests: string[] = [];
  const perCoinNewsRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/v1/mascot-arena") arenaRequests.push(url.pathname);
    if (/\/api\/v1\/(articles|news)\//.test(url.pathname)) perCoinNewsRequests.push(url.pathname);
  });
  await mockArena(page);
  await page.goto("/mascot-arena", { waitUntil: "domcontentloaded" });

  const cards = page.locator("#contenders article");
  await expect(cards).toHaveCount(15);
  await expect(cards.locator('a[href^="/news/latest-"]').first()).toBeVisible();
  const storyLinksPerCard = await cards.evaluateAll((nodes) => nodes.map(
    (node) => node.querySelectorAll('a[href^="/news/latest-"]').length,
  ));
  expect(storyLinksPerCard.every((count) => count >= 1)).toBe(true);
  await expect(page.locator('[data-analytics-view-event="mascot_relegation_view"]')).toHaveCount(1);
  await expect(page.locator('[data-analytics-event="mascot_challenger_click"]')).toHaveCount(1);
  expect(arenaRequests).toHaveLength(1);
  expect(perCoinNewsRequests).toEqual([]);

  const serious = (await new AxeBuilder({ page }).analyze()).violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => ({ id: violation.id, nodes: violation.nodes.length }));
  expect(serious).toEqual([]);
});

test("Arena keeps the required 2/3/5-column responsive grid without overflow", async ({ page }) => {
  await mockArena(page);
  for (const [width, height, expectedColumns] of [
    [360, 800, 2],
    [390, 844, 2],
    [412, 915, 2],
    [768, 1024, 3],
    [1440, 1000, 5],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/mascot-arena", { waitUntil: "domcontentloaded" });
    const cards = page.locator("#contenders article");
    await expect(cards).toHaveCount(15);
    await expect(cards.first()).toBeVisible();
    const renderedColumns = await cards.first().evaluate((node) => {
      const grid = node.parentElement;
      return grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length : 0;
    });
    expect(renderedColumns, `${width}px columns`).toBe(expectedColumns);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px overflow`).toBeLessThanOrEqual(width);
  }
});

test("Arena re-enables voting when the rolling cooldown expires", async ({ page }) => {
  await page.route(ARENA_API, (route) => route.fulfill({
    json: {
      ...arenaState(),
      can_vote: false,
      next_vote_at: new Date(Date.now() - 1_000).toISOString(),
    },
  }));
  await page.goto("/mascot-arena", { waitUntil: "domcontentloaded" });
  const firstVote = page.getByRole("button", { name: /Vote for/ }).first();
  await expect(firstVote).toBeEnabled();
  await expect(firstVote).toHaveText("VOTE");
});

test("Arena keeps CLS below 0.1 while live weekly data hydrates", async ({ page }) => {
  const live = arenaState();
  live.mascot_of_week = { ...live.ranking[0], week: "2026-W32" };
  live.hall_of_fame = [{ ...live.ranking[0], week: "2026-W32", championships: 1 }];
  await page.addInitScript(() => {
    type Shift = { value: number; time: number; sources: Array<{ node: string; previous: DOMRectReadOnly; current: DOMRectReadOnly }> };
    (window as typeof window & { __aionLayoutShifts: Shift[] }).__aionLayoutShifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value: number;
          sources?: Array<{ node?: Node; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }>;
        };
        if (!shift.hadRecentInput) {
          (window as typeof window & { __aionLayoutShifts: Shift[] }).__aionLayoutShifts.push({
            value: shift.value,
            time: shift.startTime,
            sources: (shift.sources ?? []).map(({ node, previousRect, currentRect }) => ({
              node: node instanceof Element ? node.outerHTML.slice(0, 240) : node?.nodeName ?? "unknown",
              previous: previousRect,
              current: currentRect,
            })),
          });
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.route(ARENA_API, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ json: live });
  });
  await page.goto("/mascot-arena", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/Mascot of the Week · 2026-W32/)).toBeVisible();
  await page.waitForTimeout(250);
  const shifts = await page.evaluate(() => (
    window as typeof window & { __aionLayoutShifts: Array<{ value: number; time: number; sources: unknown[] }> }
  ).__aionLayoutShifts);
  const cls = shifts.reduce((total, shift) => total + shift.value, 0);
  expect(cls, JSON.stringify(shifts)).toBeLessThan(0.1);
});

test("GA4 internal marker is opt-in, session-scoped and contains no PII", async ({ page }) => {
  await page.route(/googletagmanager\.com/, (route) => route.abort());
  await page.goto("/?utm_source=manus&aion_internal=1", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof (window as typeof window & { gtag?: unknown }).gtag === "function");
  await expect.poll(() => page.url()).not.toContain("aion_internal");
  expect(page.url()).toContain("utm_source=manus");
  await expect(page.getByRole("dialog", { name: "Your privacy choices" })).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
  const beforeConsent = await page.evaluate(() => (
    window as typeof window & { dataLayer: IArguments[] }
  ).dataLayer.map((entry) => Array.from(entry)));
  expect(beforeConsent).toContainEqual(["consent", "default", expect.objectContaining({
    analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
  })]);
  expect(beforeConsent.some((command) => command[0] === "event" && command[1] === "page_view")).toBe(false);
  await page.getByRole("button", { name: "Accept all" }).click();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(1);
  await page.waitForFunction(() => (window as typeof window & { dataLayer: IArguments[] }).dataLayer.some((entry) => entry[0] === "config"));
  const internalState = await page.evaluate(() => ({
    marker: sessionStorage.getItem("aion_internal_traffic"),
    consent: localStorage.getItem("aion-cookie-consent-v2"),
    commands: (window as typeof window & { dataLayer: IArguments[] }).dataLayer.map((entry) => Array.from(entry)),
  }));
  expect(internalState.marker).toBe("1");
  expect(internalState.consent).toContain('"analytics":true');
  expect(internalState.consent).toContain('"advertising":true');
  expect(internalState.commands).toContainEqual(["consent", "update", expect.objectContaining({ analytics_storage: "granted", ad_storage: "granted" })]);
  expect(internalState.commands).toContainEqual(["set", "traffic_type", "internal"]);
  expect(internalState.commands).toContainEqual(["set", "ip_internal_traffic_rules_value", "1"]);
  expect(JSON.stringify(internalState.commands)).not.toContain("@");

  await page.goto("/?aion_internal=0", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => typeof (window as typeof window & { gtag?: unknown }).gtag === "function");
  await expect.poll(() => page.url()).not.toContain("aion_internal");
  const visitorCommands = await page.evaluate(() => (
    window as typeof window & { dataLayer: IArguments[] }
  ).dataLayer.map((entry) => Array.from(entry)));
  expect(visitorCommands).not.toContainEqual(["set", "traffic_type", "internal"]);
  expect(visitorCommands).not.toContainEqual(["set", "ip_internal_traffic_rules_value", "1"]);
});

test("cookie controls reject, personalize and persist optional consent", async ({ page }) => {
  await page.route(/googletagmanager\.com/, (route) => route.fulfill({ contentType: "application/javascript", body: "// isolated" }));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Personalize" }).click();
  await page.getByRole("checkbox", { name: /Analytics/ }).check();
  await page.getByRole("button", { name: "Save choices" }).click();
  await expect(page.getByRole("button", { name: "Open cookie preferences" })).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("aion-cookie-consent-v2") ?? "null"))).toMatchObject({ analytics: true, advertising: false });

  await page.getByRole("button", { name: "Open cookie preferences" }).click();
  await page.getByRole("button", { name: "Reject optional" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("aion-cookie-consent-v2") ?? "null"))).toMatchObject({ analytics: false, advertising: false });
  const commands = await page.evaluate(() => (
    window as typeof window & { dataLayer: IArguments[] }
  ).dataLayer.map((entry) => Array.from(entry)));
  expect(commands).toContainEqual(["consent", "update", expect.objectContaining({ analytics_storage: "denied", ad_storage: "denied" })]);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog", { name: "Your privacy choices" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open cookie preferences" })).toBeVisible();
});
