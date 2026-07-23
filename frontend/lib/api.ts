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
    const res = await fetch(`${BACKEND}${path}`, { next: { revalidate: 60 } });
    // The API answered, so keep its honest unavailable payload distinct from
    // an unreachable backend. A non-2xx response is also an API-level data
    // failure, never a reason to silently present fixtures as live values.
    if (!res.ok) return { data: null, source: null, status: "unavailable" };
    const body = (await res.json()) as Wrapped<T>;
    return body;
  } catch {
    return null;
  }
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
  eth_dominance_pct: number;
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
