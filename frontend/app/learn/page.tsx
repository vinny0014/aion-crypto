import type { Metadata } from "next";
import Link from "next/link";
import { EXPLAINED_GUIDES } from "../../lib/editorial-content";

export const metadata: Metadata = {
  title: "Learn Crypto — A Guided Path",
  description: "A structured learning path from blockchain basics and wallets to market metrics, DeFi, staking and risk management.",
  alternates: { canonical: "/learn" },
};

const paths = [
  { title: "1. Understand the networks", text: "Separate a protocol from its native asset and learn how transactions are confirmed.", slugs: ["bitcoin", "ethereum", "xrp", "solana"] },
  { title: "2. Control custody risk", text: "Learn what a wallet controls, how backups work and why a signature can be irreversible.", slugs: ["crypto-wallet", "hot-wallet-vs-cold-wallet", "seed-phrase-security", "crypto-scams"] },
  { title: "3. Read the market", text: "Interpret supply, liquidity, dominance and chart zones without turning them into guarantees.", slugs: ["market-cap-volume-liquidity", "bitcoin-dominance", "support-and-resistance", "bitcoin-halving"] },
  { title: "4. Use applications carefully", text: "Map contracts, collateral, bridges, validators and redemption paths before depositing.", slugs: ["stablecoins", "staking", "defi", "smart-contract-risk", "bridge-risk"] },
  { title: "5. Build a decision process", text: "Evaluate claims, cap exposure and slow down decisions driven by urgency.", slugs: ["evaluate-cryptocurrency", "portfolio-risk", "fomo"] },
];

export default function Page() {
  return <div className="mx-auto max-w-5xl py-7 sm:py-10">
    <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">Learn Crypto</p><h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">A risk-first learning path</h1>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-dim">Start with how a network works, then study custody, markets and applications before considering an asset. The path is educational and does not recommend buying or selling.</p>
    <div className="mt-8 space-y-5">{paths.map((path) => <section key={path.title} className="card p-5 sm:p-6"><h2 className="font-display text-xl font-bold text-white">{path.title}</h2><p className="mt-2 text-sm leading-6 text-ink-dim">{path.text}</p><div className="mt-4 flex flex-wrap gap-2">{path.slugs.map((slug) => { const guide = EXPLAINED_GUIDES.find((item) => item.slug === slug); return guide ? <Link key={slug} href={`/explained/${slug}`} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-primary/60 hover:text-white">{guide.title}</Link> : null; })}</div></section>)}</div>
  </div>;
}
