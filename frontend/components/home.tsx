import Link from "next/link";
import type { GlobalMetrics, Kline, TickerCoin, Wrapped } from "@/lib/api";
import { FIXTURE_ARTICLES, FIXTURE_INSIGHT } from "@/lib/fixtures";
import { fmtNum, fmtPct, fmtUsd } from "@/lib/format";
import { AreaChart, Donut, FearGreedGauge, Sparkline } from "./charts";
import { CoinDot, Delta, SectionTitle, SourceTag, Unavailable } from "./ui";

// ── 1. Coin ticker strip ─────────────────────────────────────────
export function TickerBar({ ticker }: { ticker: Wrapped<TickerCoin[]> }) {
  if (!ticker.data) return null;
  return (
    <div className="border-b border-line bg-bg-soft/60">
      <div className="mx-auto flex max-w-[1400px] items-center gap-5 overflow-x-auto px-3 py-2 sm:px-5 scroll-thin">
        {ticker.data.map((c) => (
          <Link key={c.symbol} href={`/crypto/${c.symbol}`} className="flex shrink-0 items-center gap-2 text-[12.5px]">
            <CoinDot symbol={c.symbol} />
            <span className="font-semibold">{c.symbol}</span>
            <span className="num text-ink-dim">{fmtUsd(c.price)}</span>
            <Delta value={c.change_24h_pct} className="text-[11.5px]" />
          </Link>
        ))}
        <span className="ml-auto shrink-0"><SourceTag p={ticker} /></span>
      </div>
    </div>
  );
}

// ── 2. Global metrics strip ──────────────────────────────────────
export function GlobalMetricsBar({ g }: { g: Wrapped<GlobalMetrics> }) {
  const d = g.data;
  const items: [string, string, number | null][] = d
    ? [
        ["Market Cap", fmtUsd(d.market_cap_usd, true), d.market_cap_change_24h_pct],
        ["24h Volume", fmtUsd(d.volume_24h_usd, true), null],
        ["BTC Dominance", `${d.btc_dominance_pct.toFixed(1)}%`, null],
        ["ETH Dominance", `${d.eth_dominance_pct.toFixed(1)}%`, null],
        ["Active Cryptos", fmtNum(d.active_cryptocurrencies), null],
      ]
    : [];
  return (
    <div className="border-b border-line">
      <div className="mx-auto flex max-w-[1400px] items-stretch gap-6 overflow-x-auto px-3 py-3 sm:px-5 scroll-thin">
        {d ? (
          items.map(([label, value, delta]) => (
            <div key={label} className="shrink-0">
              <div className="text-[11px] font-medium uppercase tracking-wide text-ink-dim">{label}</div>
              <div className="num flex items-baseline gap-2 text-[15px] font-semibold">
                {value}
                {delta != null && <Delta value={delta} className="text-[11.5px]" />}
              </div>
            </div>
          ))
        ) : (
          <div className="text-[13px] text-ink-dim">Global metrics temporarily unavailable.</div>
        )}
        <span className="ml-auto self-center"><SourceTag p={g} /></span>
      </div>
    </div>
  );
}

// ── 3. Hero + Latest News + Breadth column ───────────────────────
function heroArticle() {
  return FIXTURE_ARTICLES[0];
}

export function HeroRow({ ticker }: { ticker: Wrapped<TickerCoin[]> }) {
  const hero = heroArticle();
  const latest = FIXTURE_ARTICLES.slice(1, 5);
  const mostRead = [...FIXTURE_ARTICLES].sort((a, b) => a.hoursAgo - b.hoursAgo).slice(0, 5);
  const coins = ticker.data ?? [];
  const upShare = coins.length ? Math.round((coins.filter((c) => c.change_24h_pct >= 0).length / coins.length) * 100) : null;

  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr_1fr]">
      {/* Hero */}
      <article className="card relative overflow-hidden p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(600px 260px at 85% 20%, rgba(124,58,237,.35), transparent 60%), radial-gradient(400px 200px at 10% 90%, rgba(34,211,238,.15), transparent 60%)" }}
        />
        <div className="relative">
          <div className="flex gap-2">
            <span className="rounded-md bg-accent-red px-2 py-0.5 text-[11px] font-bold uppercase text-white">Top Story</span>
            <span className="chip">{hero.tag}</span>
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-3xl">
            <Link href={`/news/${hero.slug}`} className="hover:text-primary-glow">{hero.title}</Link>
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-dim">{hero.summary}</p>
          <div className="mt-4 flex items-center gap-3 text-[12px] text-ink-dim">
            <span>AION Crypto Desk</span>·<span>{hero.hoursAgo}h ago</span>·<span>{hero.minutes} min read</span>
          </div>
          <Link
            href={`/news/${hero.slug}`}
            className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-primary-glow"
          >
            Read more
          </Link>
        </div>
      </article>

      {/* Latest news */}
      <div className="card p-4">
        <SectionTitle href="/news">Latest News</SectionTitle>
        <ul className="divide-y divide-line">
          {latest.map((a) => (
            <li key={a.slug} className="py-3 first:pt-0 last:pb-0">
              <Link href={`/news/${a.slug}`} className="group block">
                <div className="flex items-center gap-2 text-[11px] text-ink-dim">
                  <span className="chip">{a.tag}</span><span>{a.hoursAgo}h ago</span>
                </div>
                <div className="mt-1 text-[13.5px] font-medium leading-snug group-hover:text-primary-glow">{a.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Most read + market breadth */}
      <div className="grid gap-4">
        <div className="card p-4">
          <SectionTitle href="/news" linkLabel="More">Most Read</SectionTitle>
          <ol className="space-y-2.5">
            {mostRead.map((a, i) => (
              <li key={a.slug} className="flex gap-2.5">
                <span className="num mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/25 text-[11px] font-bold text-primary-glow">{i + 1}</span>
                <Link href={`/news/${a.slug}`} className="text-[13px] leading-snug text-ink-dim hover:text-ink">{a.title}</Link>
              </li>
            ))}
          </ol>
        </div>
        <div className="card p-4 text-center">
          <SectionTitle>Market Breadth</SectionTitle>
          {upShare == null ? (
            <Unavailable what="Breadth" />
          ) : (
            <>
              <div className="flex justify-center"><FearGreedGauge value={upShare} /></div>
              <div className="num -mt-6 text-3xl font-bold">{upShare}</div>
              <div className={`text-[13px] font-semibold ${upShare >= 50 ? "text-accent-green" : "text-accent-red"}`}>
                {upShare >= 50 ? "Risk-on" : "Risk-off"}
              </div>
              <p className="mt-2 text-[11.5px] text-ink-dim">Share of tracked coins up over 24h — computed from the data above.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 4. Market overview row: chart, heatmap, dominance, AI summary ─
export function MarketRow({
  btcKlines,
  table,
  g,
}: {
  btcKlines: Wrapped<Kline[]>;
  table: Wrapped<TickerCoin[]>;
  g: Wrapped<GlobalMetrics>;
}) {
  const coins = table.data ?? [];
  const heat = coins.slice(0, 12);
  const dom = g.data;
  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1.2fr_1fr]">
      <div className="card p-4">
        <SectionTitle href="/crypto/BTC" linkLabel="Full Chart">Bitcoin — 7d Overview</SectionTitle>
        {btcKlines.data ? <AreaChart klines={btcKlines.data} /> : <Unavailable what="Chart" />}
        <div className="mt-2 flex justify-end"><SourceTag p={btcKlines} /></div>
      </div>

      <div className="card p-4">
        <SectionTitle href="/markets" linkLabel="Full Map">Crypto Heatmap</SectionTitle>
        {heat.length ? (
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {heat.map((c) => {
              const up = c.change_24h_pct >= 0;
              const intensity = Math.min(Math.abs(c.change_24h_pct) / 4, 1);
              return (
                <Link
                  key={c.symbol}
                  href={`/crypto/${c.symbol}`}
                  className="rounded-lg p-2 text-center transition-transform hover:scale-[1.03]"
                  style={{ background: up ? `rgba(34,197,94,${0.18 + intensity * 0.5})` : `rgba(239,68,68,${0.18 + intensity * 0.5})` }}
                >
                  <div className="text-[13px] font-bold">{c.symbol}</div>
                  <div className="num text-[11.5px]">{fmtPct(c.change_24h_pct)}</div>
                  <div className="num text-[10.5px] text-ink/80">{fmtUsd(c.price)}</div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Unavailable what="Heatmap" />
        )}
        <div className="mt-2 flex justify-end"><SourceTag p={table} /></div>
      </div>

      <div className="grid gap-4">
        <div className="card p-4">
          <SectionTitle href="/markets">Market Dominance</SectionTitle>
          {dom ? (
            <div className="flex items-center gap-4">
              <Donut
                slices={[
                  { label: "BTC", value: dom.btc_dominance_pct, color: "#F59E0B" },
                  { label: "ETH", value: dom.eth_dominance_pct, color: "#A855F7" },
                  { label: "Others", value: Math.max(0, 100 - dom.btc_dominance_pct - dom.eth_dominance_pct), color: "#22D3EE" },
                ]}
              />
              <ul className="space-y-1.5 text-[13px]">
                <li className="num"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent-btc" />BTC {dom.btc_dominance_pct.toFixed(1)}%</li>
                <li className="num"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary-glow" />ETH {dom.eth_dominance_pct.toFixed(1)}%</li>
                <li className="num"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent-cyan" />Others {(100 - dom.btc_dominance_pct - dom.eth_dominance_pct).toFixed(1)}%</li>
              </ul>
            </div>
          ) : (
            <Unavailable what="Dominance" />
          )}
        </div>
        <div className="card border-primary/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="chip border-primary/40 text-primary-glow">AI</span>
            <h2 className="text-[13px] font-semibold uppercase tracking-wide">Market Summary</h2>
          </div>
          {FIXTURE_INSIGHT.paragraphs.map((p) => (
            <p key={p.slice(0, 20)} className="mt-2 text-[13px] leading-relaxed text-ink-dim">{p}</p>
          ))}
          <p className="mt-3 text-[11px] text-ink-dim/80">{FIXTURE_INSIGHT.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}

// ── 5. Movers row ────────────────────────────────────────────────
function MoverList({ title, coins, spark }: { title: string; coins: TickerCoin[]; spark: (c: TickerCoin) => number[] }) {
  return (
    <div className="card p-4">
      <SectionTitle href="/markets">{title}</SectionTitle>
      {coins.length ? (
        <ol className="space-y-2">
          {coins.map((c, i) => (
            <li key={c.symbol}>
              <Link href={`/crypto/${c.symbol}`} className="grid grid-cols-[16px_1fr_auto_72px] items-center gap-2 rounded-md px-1 py-1 hover:bg-bg-soft">
                <span className="num text-[12px] text-ink-dim">{i + 1}</span>
                <span className="flex items-center gap-2 text-[13px] font-semibold"><CoinDot symbol={c.symbol} />{c.symbol}</span>
                <span className="text-right">
                  <span className="num block text-[12.5px]">{fmtUsd(c.price)}</span>
                  <Delta value={c.change_24h_pct} className="text-[11px]" />
                </span>
                <Sparkline data={spark(c)} up={c.change_24h_pct >= 0} />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <Unavailable what="Market data" />
      )}
    </div>
  );
}

export function MoversRow({ table }: { table: Wrapped<TickerCoin[]> }) {
  const coins = table.data ?? [];
  const sorted = [...coins].sort((a, b) => b.change_24h_pct - a.change_24h_pct);
  const gainers = sorted.slice(0, 5);
  const losers = sorted.slice(-5).reverse();
  const trending = [...coins].sort((a, b) => b.volume_24h_quote - a.volume_24h_quote).slice(0, 5);
  // deterministic mini-series derived from real 24h range (documented approximation)
  const spark = (c: TickerCoin) => {
    const pts = 16;
    const out: number[] = [];
    for (let i = 0; i < pts; i++) {
      const t = i / (pts - 1);
      const base = c.low_24h + (c.high_24h - c.low_24h) * (c.change_24h_pct >= 0 ? t : 1 - t);
      const wobble = Math.sin(i * 2.1 + c.symbol.charCodeAt(0)) * (c.high_24h - c.low_24h) * 0.12;
      out.push(base + wobble);
    }
    out[pts - 1] = c.price;
    return out;
  };
  return (
    <section className="mt-4 grid gap-4 md:grid-cols-3">
      <MoverList title="Top Gainers (24h)" coins={gainers} spark={spark} />
      <MoverList title="Top Losers (24h)" coins={losers} spark={spark} />
      <MoverList title="Trending by Volume" coins={trending} spark={spark} />
    </section>
  );
}

// ── 6. Articles grid ─────────────────────────────────────────────
export function ArticlesGrid() {
  return (
    <section className="mt-6">
      <SectionTitle href="/news" linkLabel="View All Articles">Latest Articles</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {FIXTURE_ARTICLES.map((a) => (
          <Link key={a.slug} href={`/news/${a.slug}`} className="card group overflow-hidden">
            <div
              aria-hidden
              className="flex h-24 items-end p-3"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,.5), rgba(34,211,238,.18)), #111119" }}
            >
              <span className="rounded bg-bg/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-glow">{a.tag}</span>
            </div>
            <div className="p-3">
              <h3 className="text-[13.5px] font-semibold leading-snug group-hover:text-primary-glow">{a.title}</h3>
              <div className="mt-2 text-[11px] text-ink-dim">{a.hoursAgo}h ago · {a.minutes} min read</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── 7. Newsletter band ───────────────────────────────────────────
export function NewsletterBand() {
  return (
    <section className="card mt-6 flex flex-col items-center gap-4 p-6 text-center md:flex-row md:justify-between md:text-left">
      <div>
        <h2 className="font-display text-lg font-bold">Stay updated</h2>
        <p className="text-[13px] text-ink-dim">Weekly crypto market intelligence in your inbox. No spam, unsubscribe anytime.</p>
      </div>
      <form action="/newsletter" method="get" className="flex w-full max-w-sm gap-2">
        <input
          type="email" name="email" required placeholder="Enter your email" aria-label="Email address"
          className="w-full rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm placeholder:text-ink-dim focus:border-primary focus:outline-none"
        />
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-glow">Subscribe</button>
      </form>
    </section>
  );
}

// ── 8. BTC & ETH snapshots + watchlist entry (daily-use anchors) ──
function SnapshotCard({ c, name, wrap }: { c?: TickerCoin; name: string; wrap: Wrapped<TickerCoin[]> }) {
  if (!c) return <div className="card p-4"><Unavailable what={`${name} snapshot`} /></div>;
  const up = c.change_24h_pct >= 0;
  return (
    <Link href={`/crypto/${c.symbol}`} className="card group p-4 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CoinDot symbol={c.symbol} />
          <div>
            <div className="text-[14px] font-bold group-hover:text-primary-glow">{name} Overview</div>
            <div className="text-[11px] text-ink-dim">{c.symbol} / USD · updated continuously</div>
          </div>
        </div>
        <Delta value={c.change_24h_pct} />
      </div>
      <div className="num mt-3 text-[22px] font-bold">{fmtUsd(c.price)}</div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-ink-dim">
        <div><div className="uppercase tracking-wide">24h High</div><div className={`num text-[12px] ${up ? "text-accent-green" : "text-ink"}`}>{fmtUsd(c.high_24h)}</div></div>
        <div><div className="uppercase tracking-wide">24h Low</div><div className="num text-[12px] text-ink">{fmtUsd(c.low_24h)}</div></div>
        <div><div className="uppercase tracking-wide">24h Volume</div><div className="num text-[12px] text-ink">{fmtUsd(c.volume_24h_quote)}</div></div>
      </div>
      <div className="mt-2 flex justify-end"><SourceTag p={wrap} /></div>
    </Link>
  );
}

export function SnapshotsRow({ ticker }: { ticker: Wrapped<TickerCoin[]> }) {
  const coins = ticker.data ?? [];
  const btc = coins.find((c) => c.symbol === "BTC");
  const eth = coins.find((c) => c.symbol === "ETH");
  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-3">
      <SnapshotCard c={btc} name="Bitcoin" wrap={ticker} />
      <SnapshotCard c={eth} name="Ethereum" wrap={ticker} />
      <div className="card flex flex-col justify-between p-4">
        <div>
          <div className="text-[14px] font-bold">Your Watchlist</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">
            Track the coins you care about and check back throughout the day. Your list is saved on this device — alerts are on the roadmap.
          </p>
        </div>
        <Link href="/watchlist" className="mt-3 inline-flex w-fit items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-glow">
          Open Watchlist
        </Link>
      </div>
    </section>
  );
}
