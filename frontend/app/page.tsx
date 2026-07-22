import { getGlobal, getKlines, getMarketsTable, getTicker } from "@/lib/api";
import {
  ArticlesGrid, GlobalMetricsBar, HeroRow, MarketRow, MoversRow, NewsletterBand, SnapshotsRow, TickerBar,
} from "@/components/home";

export const revalidate = 60;

export default async function Home() {
  const [ticker, table, global_, btcKlines] = await Promise.all([
    getTicker(),
    getMarketsTable(),
    getGlobal(),
    getKlines("BTC", "1h", 168),
  ]);

  return (
    <>
      <TickerBar ticker={ticker} />
      <GlobalMetricsBar g={global_} />
      <HeroRow ticker={ticker} />
      <MarketRow btcKlines={btcKlines} table={table} g={global_} />
      <MoversRow table={table} />
      <SnapshotsRow ticker={ticker} />
      <ArticlesGrid />
      <NewsletterBand />
    </>
  );
}
