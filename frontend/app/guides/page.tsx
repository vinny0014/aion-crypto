import type { Metadata } from "next";
import Link from "next/link";
import { EXPLAINED_GUIDES } from "../../lib/editorial-content";

export const metadata: Metadata = {
  title: "Practical Crypto Guides",
  description: "Sourced, risk-aware guides covering research, custody, staking, DeFi, scams, market structure and portfolio controls.",
  alternates: { canonical: "/guides" },
};

const practicalSlugs = [
  "evaluate-cryptocurrency", "crypto-wallet", "hot-wallet-vs-cold-wallet", "seed-phrase-security", "crypto-scams",
  "staking", "defi", "stablecoins", "smart-contract-risk", "bridge-risk", "support-and-resistance",
  "market-cap-volume-liquidity", "bitcoin-dominance", "portfolio-risk", "fomo",
];

export default function Page() {
  const guides = practicalSlugs.map((slug) => EXPLAINED_GUIDES.find((guide) => guide.slug === slug)).filter(Boolean);
  return <div className="mx-auto max-w-5xl py-7 sm:py-10">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Practical Guides</p>
    <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Research and protect before you transact</h1>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-dim">Use these guides as a due-diligence path: understand the asset, map the dependencies, set a loss boundary, secure the keys and verify every transaction. Each page names its primary references, limitations and last review date.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{guides.map((guide) => guide && <article key={guide.slug} className="card flex flex-col p-5">
      <h2 className="font-display text-xl font-bold text-white">{guide.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-ink-dim">{guide.description}</p>
      <Link href={`/explained/${guide.slug}`} className="mt-5 text-sm font-bold text-primary-glow hover:text-white">Open the guide →</Link>
    </article>)}</div>
    <section className="mt-10 rounded-2xl border border-line bg-bg-soft p-6"><h2 className="font-display text-xl font-bold text-white">Publication standard</h2><p className="mt-2 text-sm leading-6 text-ink-dim">A guide is listed only when it contains a complete explanation, explicit risks, verification references and internal paths to related material. Outlines and fixture content are not presented as finished guidance.</p></section>
  </div>;
}
