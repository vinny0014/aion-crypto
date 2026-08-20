import type { Metadata } from "next";
import Link from "next/link";
import { EXPLAINED_GUIDES } from "../../lib/editorial-content";

export const metadata: Metadata = {
  title: "AION Explained — Clear Crypto Guides",
  description: "Plain-language, risk-aware explanations of Bitcoin, Ethereum, XRP, crypto wallets and Bitcoin ETFs.",
  alternates: { canonical: "/explained" },
};

export default function ExplainedIndex() {
  const jsonLd = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: "AION Explained",
    description: metadata.description,
    hasPart: EXPLAINED_GUIDES.map((guide) => ({ "@type": "Article", headline: guide.title, url: `/explained/${guide.slug}` })),
  };
  return <div className="mx-auto max-w-5xl py-7 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">AION Explained</p>
    <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Crypto, without the fog</h1>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-dim">Short, factual guides that separate protocols, assets and investment products. Every guide includes the trade-offs and risks that headlines often omit.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {EXPLAINED_GUIDES.map((guide) => <article key={guide.slug} className="card flex flex-col p-5">
        <h2 className="font-display text-xl font-bold text-white">{guide.title}</h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-ink-dim">{guide.description}</p>
        <Link href={`/explained/${guide.slug}`} className="mt-5 text-sm font-bold text-primary-glow hover:text-white">Read the guide →</Link>
      </article>)}
    </div>
  </div>;
}
