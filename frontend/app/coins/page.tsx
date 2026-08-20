import type { Metadata } from "next";
import Link from "next/link";
import { getMarketsTable } from "../../lib/api";
import { COIN_GUIDES, EXPLAINED_GUIDES } from "../../lib/editorial-content";
import { Delta, SourceTag } from "../../components/ui";
import { fmtUsd } from "../../lib/format";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Crypto Coin Hubs — Prices, News and Guides",
  description: "Explore useful Bitcoin, Ethereum, XRP and leading crypto hubs with live market data, verified coverage and plain-language guides.",
  alternates: { canonical: "/coins" },
};

export default async function CoinsPage() {
  const table = await getMarketsTable();
  const coins = table.data ?? [];
  const featured = ["BTC", "ETH", "XRP"].map((symbol) => ({ guide: COIN_GUIDES[symbol], market: coins.find((coin) => coin.symbol === symbol) }));
  const remaining = coins.filter((coin) => !COIN_GUIDES[coin.symbol]).slice(0, 17);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: "AION Crypto Coin Hubs", description: metadata.description,
    hasPart: featured.map(({ guide }) => ({ "@type": "WebPage", name: `${guide.name} (${guide.symbol})`, url: `/crypto/${guide.symbol}` })),
  };
  return <div className="py-7 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <header className="max-w-4xl">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Coin Hubs</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Prices are the start, not the whole story</h1>
      <p className="mt-3 text-sm leading-7 text-ink-dim">Move from live market data to verified news, Arena characters and clear explanations of how each network works and what can go wrong.</p>
    </header>
    <section className="mt-8 grid gap-4 lg:grid-cols-3" aria-labelledby="featured-hubs">
      <h2 id="featured-hubs" className="sr-only">Featured coin hubs</h2>
      {featured.map(({ guide, market }) => <article key={guide.symbol} className="card flex flex-col p-5">
        <div className="flex items-start justify-between gap-4"><div><span className="chip">{guide.symbol}</span><h2 className="mt-3 font-display text-2xl font-bold text-white">{guide.name}</h2></div>{market && <div className="text-right"><p className="num text-lg font-bold text-white">{fmtUsd(market.price)}</p><Delta value={market.change_24h_pct} className="text-xs" /></div>}</div>
        <p className="mt-3 text-sm font-semibold text-primary-glow">{guide.purpose}</p>
        <p className="mt-2 flex-1 text-sm leading-6 text-ink-dim">{guide.overview}</p>
        <div className="mt-5 flex flex-wrap gap-2"><Link href={`/crypto/${guide.symbol}`} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-glow">Open market hub</Link><Link href={`/explained/${guide.explainedSlug}`} className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink hover:text-white">Read explainer</Link></div>
      </article>)}
    </section>
    <section className="mt-10" aria-labelledby="all-coins">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Market directory</p><h2 id="all-coins" className="mt-1 font-display text-2xl font-bold text-white">More coin pages</h2></div><SourceTag p={table} /></div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{remaining.map((coin) => <Link key={coin.symbol} href={`/crypto/${coin.symbol}`} className="card p-4 hover:border-primary/60"><p className="font-display text-lg font-bold text-white">{coin.symbol}</p><p className="mt-1 truncate text-xs text-ink-dim">{coin.name}</p><p className="num mt-3 text-sm text-white">{fmtUsd(coin.price)}</p><Delta value={coin.change_24h_pct} className="text-[11px]" /></Link>)}</div>
    </section>
    <section className="mt-10 rounded-2xl border border-line bg-bg-soft p-5 sm:p-7" aria-labelledby="explained-title">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Education</p><h2 id="explained-title" className="mt-1 font-display text-2xl font-bold text-white">AION Explained</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{EXPLAINED_GUIDES.map((guide) => <Link key={guide.slug} href={`/explained/${guide.slug}`} className="rounded-xl border border-line bg-card p-4 text-sm font-semibold text-ink hover:border-primary/60 hover:text-white">{guide.title}</Link>)}</div>
    </section>
  </div>;
}
