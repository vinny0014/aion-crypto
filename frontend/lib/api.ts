// Server-side data access. Every payload carries provenance:
// source: "binance" | "coingecko" | "fixture", status: "live" | "stale" | "sample" | "unavailable".
// Fixtures are ONLY used when the backend is unreachable, and are always
// labeled "sample" in the UI — never presented as live market data.
import {
  FIXTURE_GLOBAL,
  FIXTURE_KLINES,
  FIXTURE_TABLE,
  FIXTURE_TICKER,
} from "./fixtures";

// BACKEND_URL is server-only. Hostinger preview supplies the public variable,
// so accept it as the server-rendered fallback as well.
const BACKEND = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL)?.replace(/\/$/, "");
const BACKEND_TIMEOUT_MS = 8_000;

export type Provenance = {
  source: string | null;
  status: "live" | "stale" | "sample" | "unavailable" | "not_found";
  stale?: boolean;
  fetched_at?: number;
};

export type Wrapped<T> = Provenance & { data: T | null };

async function backendGet<T>(path: string): Promise<Wrapped<T> | null> {
  if (!BACKEND) return null;
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Wrapped<T>;
    return body;
  } catch {
    return null;
  }
}

async function backendJson<T>(path: string): Promise<T | null> {
  if (!BACKEND) return null;
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch { return null; }
}

function sample<T>(data: T): Wrapped<T> {
  return { data, source: "fixture", status: "sample" };
}

export type TickerCoin = {
  symbol: string;
  name: string;
  price: number;
  change_24h_pct: number;
  high_24h: number;
  low_24h: number;
  volume_24h_quote: number;
};

export async function getTicker(): Promise<Wrapped<TickerCoin[]>> {
  return (await backendGet<TickerCoin[]>("/api/v1/market/ticker")) ?? sample(FIXTURE_TICKER);
}

export async function getMarketsTable(): Promise<Wrapped<TickerCoin[]>> {
  return (await backendGet<TickerCoin[]>("/api/v1/market/table?limit=20")) ?? sample(FIXTURE_TABLE);
}

export type GlobalMetrics = {
  market_cap_usd: number;
  volume_24h_usd: number;
  btc_dominance_pct: number;
  eth_dominance_pct: number | null;
  market_cap_change_24h_pct: number;
  active_cryptocurrencies: number;
};

export async function getGlobal(): Promise<Wrapped<GlobalMetrics>> {
  return (await backendGet<GlobalMetrics>("/api/v1/market/global")) ?? sample(FIXTURE_GLOBAL);
}

export type CoinDetail = {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change_1h_pct: number | null;
  change_24h_pct: number;
  change_7d_pct: number | null;
  market_cap_usd: number | null;
  volume_24h_usd: number | null;
  circulating_supply: number | null;
  high_24h: number;
  low_24h: number;
  ath: number | null;
  image: string | null;
};

export async function getCoin(symbol: string): Promise<Wrapped<CoinDetail>> {
  const live = await backendGet<CoinDetail>(`/api/v1/market/coins/${symbol}`);
  if (live) return live;
  const fx = FIXTURE_TABLE.find((c) => c.symbol === symbol.toUpperCase());
  if (!fx) return { data: null, source: null, status: "not_found" };
  return sample({
    symbol: fx.symbol,
    name: fx.name,
    category: "—",
    price: fx.price,
    change_1h_pct: null,
    change_24h_pct: fx.change_24h_pct,
    change_7d_pct: null,
    market_cap_usd: null,
    volume_24h_usd: fx.volume_24h_quote,
    circulating_supply: null,
    high_24h: fx.high_24h,
    low_24h: fx.low_24h,
    ath: null,
    image: null,
  });
}

// klines: [openTime, open, high, low, close, volume]
export type Kline = [number, number, number, number, number, number];

export async function getKlines(symbol: string, interval = "1h", limit = 168): Promise<Wrapped<Kline[]>> {
  return (
    (await backendGet<Kline[]>(`/api/v1/market/klines/${symbol}?interval=${interval}&limit=${limit}`)) ??
    sample(FIXTURE_KLINES[symbol.toUpperCase()] ?? FIXTURE_KLINES.BTC)
  );
}

export type PublishedArticle = {
  id: number; slug: string; title: string; subtitle: string; summary: string; body: string;
  category: string; tags: string[]; related_asset: string; priority: string; image_url: string;
  sources: string[]; source_name: string; source_published_at: string | null;
  author: string; canonical: string; published_at: string; updated_at: string;
};

export async function getPublishedArticles(): Promise<PublishedArticle[]> {
  const response = await backendJson<{ data: PublishedArticle[] }>("/api/v1/articles?limit=100");
  return response?.data ?? [];
}

export async function getPublishedArticle(slug: string): Promise<PublishedArticle | null> {
  const response = await backendJson<{ data: PublishedArticle }>(`/api/v1/articles/${encodeURIComponent(slug)}`);
  return response?.data ?? null;
}

export type MascotRankingItem = {
  symbol: string; coin: string; title: string; position: number; votes: number;
  percentage: number; movement: number;
  latest_news: { slug: string; title: string; published_at: string } | null;
};

export type MascotArenaState = {
  round: { id: number; week: string; starts_at: string; ends_at: string; status: string; total_votes: number };
  champion: MascotRankingItem;
  mascot_of_week: (MascotRankingItem & { week: string }) | null;
  ranking: MascotRankingItem[];
  hall_of_fame: Array<MascotRankingItem & { week: string; championships: number }>;
  next_challenger: { symbol: string; coin: string; title: string } | null;
  last_rotation: { relegated: { symbol: string; coin: string; title: string }; promoted: { symbol: string; coin: string; title: string }; week: string } | null;
  can_vote: boolean;
  next_vote_at: string | null;
};

export async function getMascotArena(): Promise<MascotArenaState | null> {
  return backendJson<MascotArenaState>("/api/v1/mascot-arena");
}
