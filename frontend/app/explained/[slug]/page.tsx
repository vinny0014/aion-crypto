import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXPLAINED_GUIDES, explainedGuide } from "../../../lib/editorial-content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return EXPLAINED_GUIDES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = explainedGuide((await params).slug);
  if (!guide) return {};
  return { title: `${guide.title} — AION Explained`, description: guide.description, alternates: { canonical: `/explained/${guide.slug}` } };
}

export default async function ExplainedPage({ params }: Props) {
  const guide = explainedGuide((await params).slug);
  if (!guide) notFound();
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description,
    author: { "@type": "Organization", name: "AION Crypto" }, publisher: { "@type": "Organization", name: "AION Crypto" },
    mainEntityOfPage: `/explained/${guide.slug}`, articleSection: "Crypto Education",
  };
  return <article className="mx-auto max-w-3xl py-7 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <nav className="text-xs text-ink-dim" aria-label="Breadcrumb"><Link href="/explained" className="hover:text-white">AION Explained</Link> / <span className="text-ink">{guide.title}</span></nav>
    <header className="mt-5 border-b border-line pb-7">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">AION Explained</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-5xl">{guide.title}</h1>
      <p className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-base leading-7 text-ink">{guide.answer}</p>
    </header>
    <div className="mt-8 space-y-9">
      {guide.sections.map((section) => <section key={section.heading}>
        <h2 className="font-display text-2xl font-bold text-white">{section.heading}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 text-[15px] leading-7 text-ink-dim">{paragraph}</p>)}
        {section.points && <ul className="mt-4 space-y-2 text-sm text-ink-dim">{section.points.map((point) => <li key={point} className="rounded-lg border border-line bg-card px-4 py-3">{point}</li>)}</ul>}
      </section>)}
    </div>
    {!!guide.relatedCoins?.length && <aside className="mt-10 rounded-2xl border border-line bg-card p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-white">Live data</h2>
      <div className="mt-3 flex flex-wrap gap-2">{guide.relatedCoins.map((symbol) => <Link key={symbol} href={`/crypto/${symbol}`} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-glow">Open {symbol} market hub</Link>)}</div>
    </aside>}
    <p className="mt-8 text-xs leading-5 text-ink-dim">Educational content only. This page does not recommend buying, selling or holding any asset. Verify current product, tax and regulatory details for your jurisdiction.</p>
  </article>;
}
