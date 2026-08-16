import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SYMBOLS = [
  "BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK",
  "AVAX", "DOT", "SHIB", "PEPE", "HYPE", "TRX", "SUI",
] as const;

const ARENA_API = "http://127.0.0.1:3100/api/v1/mascot-arena";

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
  expect(await cards.evaluateAll((nodes) => nodes.every((node) => Boolean(
    node.querySelector('a[href^="/news/latest-"]'),
  )))).toBe(true);
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
    const firstRowTop = (await cards.nth(0).boundingBox())?.y;
    expect(firstRowTop, `${width}px first card`).toBeDefined();
    const firstRowCount = await cards.evaluateAll((nodes, top) => nodes.filter((node) => {
      const y = (node as HTMLElement).getBoundingClientRect().y;
      return Math.abs(y - Number(top)) < 2;
    }).length, firstRowTop);
    expect(firstRowCount, `${width}px columns`).toBe(expectedColumns);
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
