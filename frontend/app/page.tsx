import type { Metadata } from "next";
import { getGlobal, getKlines, getMarketsTable, getMascotArena, getPublishedArticles, getTicker } from "../lib/api";
import {
  ArticlesGrid, GlobalMetricsBar, HeroRow, MarketRow, MascotArenaPreview, MoversRow, NewsletterBand, SnapshotsRow, TickerBar,
} from "../components/home";
import { APP_NAME, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: `${SITE_URL}/`,
  isPartOf: {
    "@type": "WebSite",
    name: APP_NAME,
    url: `${SITE_URL}/`,
  },
};

export default async function Home() {
  const [ticker, table, global_, btcKlines, articles, arena] = await Promise.all([
    getTicker(),
    getMarketsTable(),
    getGlobal(),
    getKlines("BTC", "1h", 168),
    getPublishedArticles(),
    getMascotArena(),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <TickerBar ticker={ticker} />
      <section className="mt-4 rounded-xl border border-line bg-bg-soft/50 px-4 py-3" aria-labelledby="home-introduction-title">
        <h1 id="home-introduction-title" className="font-display text-xl font-bold">AION Crypto Market Intelligence</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-dim">
          Track live crypto prices for Bitcoin, Ethereum, XRP and other leading assets, alongside crypto market news, analysis and educational content.
        </p>
      </section>
      <GlobalMetricsBar g={global_} />
      <HeroRow ticker={ticker} articles={articles} />
      <MarketRow btcKlines={btcKlines} table={table} g={global_} />
      <MoversRow table={table} />
      <SnapshotsRow ticker={ticker} />
      <MascotArenaPreview arena={arena} />
      <ArticlesGrid articles={articles} />
      <NewsletterBand />
    </>
  );
}
