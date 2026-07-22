import type { Metadata } from "next";
import Link from "next/link";
import { FIXTURE_ARTICLES, FIXTURE_TABLE } from "@/lib/fixtures";

export const metadata: Metadata = { title: "Search", alternates: { canonical: "/search" } };

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const coins = q ? FIXTURE_TABLE.filter((c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) : [];
  const articles = q ? FIXTURE_ARTICLES.filter((a) => (a.title + a.summary + a.tag).toLowerCase().includes(q)) : [];
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Search</h1>
      <form action="/search" className="mt-4 flex gap-2">
        <input
          name="q" defaultValue={q} placeholder="Search coins, news, topics…" aria-label="Search"
          className="w-full rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-glow">Search</button>
      </form>
      {!q && <p className="mt-6 text-[14px] text-ink-dim">Type a coin symbol, name or topic to search across markets and articles.</p>}
      {q && (
        <>
          <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide">Coins ({coins.length})</h2>
          {coins.length ? (
            <ul className="mt-2 space-y-1">
              {coins.map((c) => (
                <li key={c.symbol}>
                  <Link href={`/crypto/${c.symbol}`} className="text-[14px] text-primary-glow hover:text-ink">{c.name} ({c.symbol})</Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-[13px] text-ink-dim">No coins matched "{q}".</p>}
          <h2 className="mt-6 text-[13px] font-semibold uppercase tracking-wide">Articles ({articles.length})</h2>
          {articles.length ? (
            <ul className="mt-2 space-y-2">
              {articles.map((a) => (
                <li key={a.slug}><Link href={`/news/${a.slug}`} className="text-[14px] text-ink-dim hover:text-ink">{a.title}</Link></li>
              ))}
            </ul>
          ) : <p className="mt-2 text-[13px] text-ink-dim">No articles matched "{q}".</p>}
        </>
      )}
    </div>
  );
}
