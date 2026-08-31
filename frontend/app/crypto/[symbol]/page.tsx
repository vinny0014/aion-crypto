import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoin, getKlines, getMascotArena, getPublishedArticles } from "../../../lib/api";
import { mascotFor } from "../../../lib/mascots";
import { AreaChart, CandleChart } from "../../../components/charts";
import { Delta, SourceTag } from "../../../components/ui";
import { fmtNum, fmtUsd } from "../../../lib/format";
import { COIN_GUIDES } from "../../../lib/editorial-content";

export const revalidate = 60;

type Props = { params: Promise<{ symbol: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();
  return {
    title: `${sym} Price, Chart & Market Data`,
    description: `Live ${sym} price, 24h change, volume, market cap and charts on AION Crypto.`,
    alternates: { canonical: `/crypto/${sym}` },
    robots: COIN_GUIDES[sym] ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function CoinPage({ params }: Props) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();
  const [coin, klines, published, arena] = await Promise.all([getCoin(sym), getKlines(sym, "1h", 168), getPublishedArticles(), getMascotArena()]);
  if (coin.status === "not_found") notFound();
  const d = coin.data!;
  const related = published.filter((a) => a.related_asset === sym || a.category === "Market Analysis").slice(0, 3);
  const mascot = mascotFor(sym);
  const mascotStanding = arena?.ranking.find((item) => item.symbol === sym);
  const guide = COIN_GUIDES[sym];

  const stats: [string, string][] = [
    ["Market Cap", fmtUsd(d.market_cap_usd, true)],
    ["24h Volume", fmtUsd(d.volume_24h_usd, true)],
    ["Circulating Supply", d.circulating_supply ? `${fmtNum(d.circulating_supply)} ${sym}` : "—"],
    ["24h High", fmtUsd(d.high_24h)],
    ["24h Low", fmtUsd(d.low_24h)],
    ["All-Time High", fmtUsd(d.ath)],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Markets", item: "/markets" },
      { "@type": "ListItem", position: 2, name: d.name, item: `/crypto/${sym}` },
    ],
  };

  return (
    <div className="py-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-[12px] text-ink-dim" aria-label="Breadcrumb">
        <Link href="/markets" className="hover:text-ink">Markets</Link> / <span className="text-ink">{d.name}</span>
      </nav>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{d.name} <span className="text-ink-dim">({sym})</span></h1>
            <span className="chip">{d.category}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="num text-3xl font-bold">{fmtUsd(d.price)}</span>
            <Delta value={d.change_24h_pct} className="text-base" />
          </div>
          <div className="mt-1 flex gap-4 text-[12.5px] text-ink-dim">
            <span>1h <Delta value={d.change_1h_pct} className="text-[12px]" /></span>
            <span>7d <Delta value={d.change_7d_pct} className="text-[12px]" /></span>
          </div>
        </div>
        <SourceTag p={coin} />
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4">
          <section className="card p-4">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide">Price — 7 days</h2>
            {klines.data ? <AreaChart klines={klines.data} /> : <p className="text-[13px] text-ink-dim">Chart temporarily unavailable.</p>}
          </section>
          {guide && <section className="card p-5 sm:p-6" aria-labelledby="coin-guide-title">
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary-glow">Coin guide</p>
            <h2 id="coin-guide-title" className="mt-2 font-display text-2xl font-bold text-white">What is {guide.name}?</h2>
            <p className="mt-3 text-sm leading-7 text-ink-dim">{guide.overview}</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div><h3 className="text-xs font-bold uppercase tracking-wide text-white">How it works</h3><ul className="mt-2 space-y-2 text-xs leading-5 text-ink-dim">{guide.mechanics.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3 className="text-xs font-bold uppercase tracking-wide text-white">Common uses</h3><ul className="mt-2 space-y-2 text-xs leading-5 text-ink-dim">{guide.uses.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h3 className="text-xs font-bold uppercase tracking-wide text-white">Principal risks</h3><ul className="mt-2 space-y-2 text-xs leading-5 text-ink-dim">{guide.risks.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <Link href={`/explained/${guide.explainedSlug}`} className="mt-5 inline-flex rounded-lg border border-primary/40 px-4 py-2 text-xs font-bold text-primary-glow hover:bg-primary/10 hover:text-white">Read the complete {guide.name} explainer →</Link>
          </section>}
          {mascot && <section className="card overflow-hidden border-primary/30">
            <div className="grid sm:grid-cols-[150px_1fr]">
              <div className="relative min-h-40 bg-gradient-to-br from-primary/30 via-card to-amber-400/15">
                {mascot.image ? <Image src={mascot.image} alt={`${mascot.title}, the official ${mascot.coin} mascot`} fill sizes="(max-width: 640px) 100vw, 150px" className="object-cover object-top" /> : <div className="flex h-full min-h-40 items-center justify-center"><span className="font-display text-4xl font-black text-white">{mascot.symbol}</span></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-card" />
              </div>
              <div className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-primary-glow">Meet the Mascot</p>
                <h2 className="mt-2 font-display text-lg font-bold text-white">{mascot.title}</h2>
                <p className="mt-1 text-[12.5px] text-ink-dim">{mascot.role}{mascotStanding ? ` · Arena rank #${mascotStanding.position}` : ""}</p>
                <div className="mt-3 flex flex-wrap gap-2"><Link href={`/mascot-arena#${sym.toLowerCase()}`} className="inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-glow">Vote in Mascot Arena</Link>{mascotStanding?.latest_news ? <Link href={`/news/${mascotStanding.latest_news.slug}`} className="inline-flex rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:text-white">Latest Story</Link> : <span className="self-center text-[10px] text-ink-dim">Latest verified coverage coming soon.</span>}</div>
              </div>
            </div>
          </section>}
          <section className="card p-4">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide">Candles — hourly</h2>
            {klines.data ? <CandleChart klines={klines.data.slice(-72)} /> : <p className="text-[13px] text-ink-dim">Chart temporarily unavailable.</p>}
            <div className="mt-2 flex justify-end"><SourceTag p={klines} /></div>
          </section>
        </div>

        <div className="grid content-start gap-4">
          <section className="card p-4">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide">Market Stats</h2>
            <dl className="divide-y divide-line">
              {stats.map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 text-[13px]">
                  <dt className="text-ink-dim">{k}</dt>
                  <dd className="num font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="card p-4">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide">Related Coverage</h2>
            <ul className="space-y-2.5">
              {related.map((a) => (
                <li key={a.slug}>
                  <Link href={`/news/${a.slug}`} className="text-[13px] leading-snug text-ink-dim hover:text-ink">{a.title}</Link>
                </li>
              ))}
            </ul>
            {!related.length && <p className="text-[13px] text-ink-dim">No verified related coverage is published yet.</p>}
          </section>
          <p className="text-[11.5px] leading-relaxed text-ink-dim">
            Market data is provided for information only and may be delayed. Nothing on this page is investment advice. Crypto assets are highly volatile.
          </p>
        </div>
      </div>
    </div>
  );
}
