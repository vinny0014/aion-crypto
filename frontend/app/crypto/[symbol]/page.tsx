import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoin, getKlines } from "@/lib/api";
import { AreaChart, CandleChart } from "@/components/charts";
import { Delta, SourceTag } from "@/components/ui";
import { fmtNum, fmtUsd } from "@/lib/format";
import { FIXTURE_ARTICLES } from "@/lib/fixtures";

export const revalidate = 60;

type Props = { params: Promise<{ symbol: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();
  return {
    title: `${sym} Price, Chart & Market Data`,
    description: `Live ${sym} price, 24h change, volume, market cap and charts on AION Crypto.`,
    alternates: { canonical: `/crypto/${sym}` },
  };
}

export default async function CoinPage({ params }: Props) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();
  const [coin, klines] = await Promise.all([getCoin(sym), getKlines(sym, "1h", 168)]);
  if (coin.status === "not_found") notFound();
  const d = coin.data!;
  const related = FIXTURE_ARTICLES.filter((a) => a.tag === sym || a.category === "Markets").slice(0, 3);

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
          </section>
          <p className="text-[11.5px] leading-relaxed text-ink-dim">
            Market data is provided for information only and may be delayed. Nothing on this page is investment advice. Crypto assets are highly volatile.
          </p>
        </div>
      </div>
    </div>
  );
}
