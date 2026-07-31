import { getGlobal, getKlines, getMarketsTable, getPublishedArticles, getTicker } from "../lib/api";
import {
  ArticlesGrid, GlobalMetricsBar, HeroRow, MarketRow, MoversRow, NewsletterBand, SnapshotsRow, TickerBar,
} from "../components/home";

export const revalidate = 60;

export default async function Home() {
  const [ticker, table, global_, btcKlines, articles] = await Promise.all([
    getTicker(),
    getMarketsTable(),
    getGlobal(),
    getKlines("BTC", "1h", 168),
    getPublishedArticles(),
  ]);

  return (
    <>
      <TickerBar ticker={ticker} />
      <GlobalMetricsBar g={global_} />
      <HeroRow ticker={ticker} articles={articles} />
      <MarketRow btcKlines={btcKlines} table={table} g={global_} />
      <MoversRow table={table} />
      <SnapshotsRow ticker={ticker} />
      <ArticlesGrid articles={articles} />
      <NewsletterBand />
    </>
  );
}
