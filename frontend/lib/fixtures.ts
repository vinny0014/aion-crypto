// Fixture data used ONLY when the backend is offline (labeled "sample" in the UI).
// Editorial fixtures below are original template content for development —
// the production pipeline replaces them with sourced, verified articles.
import klines from "./fixture-klines.json";
import type { GlobalMetrics, Kline, TickerCoin } from "./api";

export const FIXTURE_TICKER: TickerCoin[] = [
  { symbol: "BTC", name: "Bitcoin", price: 66853.21, change_24h_pct: 1.32, high_24h: 67210, low_24h: 65120, volume_24h_quote: 3.42e10 },
  { symbol: "ETH", name: "Ethereum", price: 3472.11, change_24h_pct: 0.87, high_24h: 3521, low_24h: 3401, volume_24h_quote: 1.61e10 },
  { symbol: "XRP", name: "XRP", price: 0.59, change_24h_pct: 2.11, high_24h: 0.61, low_24h: 0.57, volume_24h_quote: 2.1e9 },
  { symbol: "SOL", name: "Solana", price: 164.72, change_24h_pct: 1.85, high_24h: 168.4, low_24h: 158.9, volume_24h_quote: 4.3e9 },
  { symbol: "BNB", name: "BNB", price: 584.21, change_24h_pct: 0.72, high_24h: 590.1, low_24h: 575.4, volume_24h_quote: 1.9e9 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.1253, change_24h_pct: -0.36, high_24h: 0.129, low_24h: 0.122, volume_24h_quote: 8.4e8 },
  { symbol: "ADA", name: "Cardano", price: 0.42, change_24h_pct: 1.15, high_24h: 0.43, low_24h: 0.41, volume_24h_quote: 4.2e8 },
  { symbol: "LINK", name: "Chainlink", price: 15.32, change_24h_pct: 2.33, high_24h: 15.6, low_24h: 14.8, volume_24h_quote: 5.6e8 },
];

export const FIXTURE_TABLE: TickerCoin[] = [
  ...FIXTURE_TICKER,
  { symbol: "TON", name: "Toncoin", price: 7.12, change_24h_pct: 0.66, high_24h: 7.3, low_24h: 6.9, volume_24h_quote: 3.1e8 },
  { symbol: "AVAX", name: "Avalanche", price: 29.4, change_24h_pct: 1.45, high_24h: 30.1, low_24h: 28.6, volume_24h_quote: 3.8e8 },
  { symbol: "DOT", name: "Polkadot", price: 6.21, change_24h_pct: 0.88, high_24h: 6.4, low_24h: 6.05, volume_24h_quote: 2.2e8 },
  { symbol: "MATIC", name: "Polygon", price: 0.54, change_24h_pct: 1.02, high_24h: 0.56, low_24h: 0.52, volume_24h_quote: 2.9e8 },
  { symbol: "ATOM", name: "Cosmos", price: 6.87, change_24h_pct: 0.35, high_24h: 7.0, low_24h: 6.7, volume_24h_quote: 1.4e8 },
  { symbol: "NEAR", name: "NEAR Protocol", price: 5.44, change_24h_pct: 1.88, high_24h: 5.6, low_24h: 5.2, volume_24h_quote: 3.3e8 },
  { symbol: "SUI", name: "Sui", price: 1.24, change_24h_pct: 4.31, high_24h: 1.29, low_24h: 1.15, volume_24h_quote: 4.4e8 },
  { symbol: "APT", name: "Aptos", price: 7.02, change_24h_pct: 1.21, high_24h: 7.2, low_24h: 6.8, volume_24h_quote: 1.8e8 },
  { symbol: "ARB", name: "Arbitrum", price: 0.81, change_24h_pct: -1.12, high_24h: 0.84, low_24h: 0.79, volume_24h_quote: 2.5e8 },
  { symbol: "INJ", name: "Injective", price: 22.14, change_24h_pct: 3.02, high_24h: 22.9, low_24h: 21.1, volume_24h_quote: 1.6e8 },
  { symbol: "LTC", name: "Litecoin", price: 71.3, change_24h_pct: -0.44, high_24h: 72.8, low_24h: 70.2, volume_24h_quote: 3.6e8 },
  { symbol: "UNI", name: "Uniswap", price: 7.85, change_24h_pct: 0.91, high_24h: 8.0, low_24h: 7.6, volume_24h_quote: 1.9e8 },
];

export const FIXTURE_GLOBAL: GlobalMetrics = {
  market_cap_usd: 2.48e12,
  volume_24h_usd: 9.845e10,
  btc_dominance_pct: 52.3,
  eth_dominance_pct: 17.1,
  market_cap_change_24h_pct: 1.25,
  active_cryptocurrencies: 12034,
};

export const FIXTURE_KLINES: Record<string, Kline[]> = klines as unknown as Record<string, Kline[]>;

// ── Editorial fixtures (original template copy, development only) ──

export type FxArticle = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tag: string;
  minutes: number;
  hoursAgo: number;
  body: string[];
};

export const FIXTURE_ARTICLES: FxArticle[] = [
  {
    slug: "bitcoin-etf-flows-institutional-demand",
    title: "Bitcoin ETF Flows Signal Sustained Institutional Demand",
    summary: "Spot ETF net inflows remain positive for a third consecutive week, suggesting institutional allocation is becoming structural rather than opportunistic.",
    category: "Markets", tag: "BITCOIN", minutes: 5, hoursAgo: 2,
    body: [
      "Net inflows into spot Bitcoin ETFs stayed positive across the tracked period, a pattern analysts increasingly read as structural allocation rather than short-term rotation.",
      "The composition of flows matters as much as their size. Recurring, mid-sized creations across multiple issuers point to advisory platforms and model portfolios rather than one-off block trades.",
      "As with all market coverage on AION Crypto, this article is informational and is not investment advice. Digital assets are volatile and can lose value.",
    ],
  },
  {
    slug: "ethereum-upgrade-l2-performance",
    title: "How Ethereum's Latest Upgrade Changes L2 Economics",
    summary: "Data availability costs dropped materially after the upgrade, reshaping how rollups price transactions and compete for users.",
    category: "Technology", tag: "ETHEREUM", minutes: 6, hoursAgo: 4,
    body: [
      "The most immediate effect of the upgrade shows up in data availability costs for rollups, which fell sharply and changed the unit economics of posting batches to mainnet.",
      "Cheaper batch posting compresses the cost floor for L2 transactions, and competitive pressure is pushing those savings toward end users.",
      "This article is informational and does not constitute financial advice.",
    ],
  },
  {
    slug: "defi-tvl-milestone-analysis",
    title: "DeFi TVL Recovery: What the Numbers Actually Show",
    summary: "Total value locked has recovered strongly, but the composition of that capital tells a more nuanced story about where risk appetite really is.",
    category: "Analysis", tag: "DEFI", minutes: 7, hoursAgo: 7,
    body: [
      "Headline TVL figures have recovered to multi-year highs, but decomposing the total shows most growth concentrated in staking derivatives and blue-chip lending markets.",
      "Riskier corners of DeFi remain well below their prior peaks, suggesting the recovery is led by conservative capital.",
      "Informational content only — not investment advice.",
    ],
  },
  {
    slug: "regulation-mica-what-it-means",
    title: "MiCA in Practice: What Europe's Framework Means for Crypto",
    summary: "The EU's Markets in Crypto-Assets regulation is now shaping exchange listings, stablecoin issuance and disclosure standards across the region.",
    category: "Regulation", tag: "REGULATION", minutes: 8, hoursAgo: 10,
    body: [
      "MiCA's phased application is already visible in how exchanges structure European listings and how stablecoin issuers approach reserve disclosures.",
      "For users, the practical effects are clearer disclosures and stricter marketing rules; for issuers, higher compliance costs and a single passportable regime.",
      "This overview is informational and is not legal or financial advice.",
    ],
  },
  {
    slug: "solana-ecosystem-momentum",
    title: "Solana's DEX Volume Keeps Outpacing the Field",
    summary: "Low fees and consumer-facing apps continue to drive on-chain activity, with DEX volume holding a leading share for another month.",
    category: "Markets", tag: "ALTCOINS", minutes: 4, hoursAgo: 12,
    body: [
      "On-chain data shows Solana DEX volume maintaining a leading share among smart-contract platforms, driven by low transaction costs and consumer applications.",
      "Sustainability of the trend depends on fee markets and validator economics as activity scales.",
      "Informational content only — not investment advice.",
    ],
  },
  {
    slug: "guide-crypto-self-custody-basics",
    title: "Self-Custody Basics: A Practical Security Checklist",
    summary: "An evergreen guide to wallet types, seed phrase handling, and the operational habits that prevent most self-custody losses.",
    category: "Guides", tag: "GUIDE", minutes: 9, hoursAgo: 30,
    body: [
      "Most self-custody losses come from operational mistakes, not exotic exploits: phishing, seed phrases stored digitally, and unverified transaction signing.",
      "A minimal safe setup separates a hardware-backed vault from a small hot wallet, with the seed phrase stored offline in two physical locations.",
      "This guide is educational and does not recommend any specific product or investment.",
    ],
  },
];

export const FIXTURE_INSIGHT = {
  headline: "Market structure summary",
  paragraphs: [
    "Momentum remains constructive while Bitcoin holds above key resistance-turned-support levels. Breadth has improved, with majors participating rather than a single-asset rally.",
    "Derivatives positioning is elevated but not extreme; funding remains within a normal range. On-chain settlement volume continues to trend higher.",
  ],
  disclaimer: "Automated summary generated from market data templates. Informational only — not investment advice.",
};
