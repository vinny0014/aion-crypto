import type { Metadata } from "next";
import Link from "next/link";
import { EXPLAINED_GUIDES } from "../../lib/editorial-content";

export const metadata: Metadata = { title: "Crypto Research Library", description: "Protocol, custody and market-structure research with primary references, limitations and a visible review date.", alternates: { canonical: "/research" } };
const researchSlugs = ["bitcoin", "ethereum", "xrp", "solana", "bnb", "cardano", "stablecoins", "staking", "defi", "smart-contract-risk", "bridge-risk", "bitcoin-etf"];

export default function Page() {
  const items = researchSlugs.map((slug) => EXPLAINED_GUIDES.find((guide) => guide.slug === slug)).filter(Boolean);
  return <div className="mx-auto max-w-5xl py-7 sm:py-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Research Library</p><h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Protocols, products and dependencies</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-ink-dim">Research starts with primary documentation and keeps the limitations visible. Each entry separates what a system is designed to do from adoption claims, market expectations and investment outcomes.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => item && <article key={item.slug} className="card flex flex-col p-5"><h2 className="font-display text-xl font-bold text-white">{item.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-ink-dim">{item.description}</p><div className="mt-4 flex items-center justify-between gap-3 text-xs text-ink-dim"><span>{item.sources?.length ?? 0} primary references</span>{item.reviewedAt && <time dateTime={item.reviewedAt}>{item.reviewedAt}</time>}</div><Link href={`/explained/${item.slug}`} className="mt-4 text-sm font-bold text-primary-glow hover:text-white">Open research entry →</Link></article>)}</div>
  </div>;
}
