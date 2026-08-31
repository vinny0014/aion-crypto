import type { Metadata } from "next";
import Link from "next/link";
import { EXPLAINED_GUIDES } from "../../lib/editorial-content";

export const metadata: Metadata = { title: "Crypto Market Analysis", description: "Reproducible frameworks for interpreting crypto market structure, liquidity, dominance and risk without price promises.", alternates: { canonical: "/analysis" } };
const analysisSlugs = ["market-cap-volume-liquidity", "bitcoin-dominance", "support-and-resistance", "portfolio-risk", "fomo"];

export default function Page() {
  const items = analysisSlugs.map((slug) => EXPLAINED_GUIDES.find((guide) => guide.slug === slug)).filter(Boolean);
  return <div className="mx-auto max-w-5xl py-7 sm:py-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Analysis</p><h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Methods before conclusions</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-ink-dim">AION analysis labels the data provider, timestamp, calculation and limitation. A metric describes a market state; it does not become a price prediction simply because it is presented on a chart.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => item && <article key={item.slug} className="card flex flex-col p-5"><h2 className="font-display text-xl font-bold text-white">{item.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-ink-dim">{item.description}</p><Link href={`/explained/${item.slug}`} className="mt-5 text-sm font-bold text-primary-glow hover:text-white">Review the method →</Link></article>)}</div>
    <section className="mt-10 rounded-2xl border border-line bg-bg-soft p-6"><h2 className="font-display text-xl font-bold text-white">Analytical boundary</h2><p className="mt-2 text-sm leading-6 text-ink-dim">Facts from a source, deterministic calculations and editorial interpretation must remain distinguishable. Unsupported causes, guaranteed outcomes and personalized financial instructions fail the publication gate.</p><Link href="/sources-methodology" className="mt-4 inline-block text-sm font-bold text-primary-glow">Read the source methodology →</Link></section>
  </div>;
}
