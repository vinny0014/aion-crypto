import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXPLAINED_GUIDES, explainedGuide } from "../../../lib/editorial-content";

type Props = { params: Promise<{ slug: string }> };

// Rebuild guide HTML frequently. The route-specific response header in
// next.config also prevents browsers and the hosting edge from retaining it
// across deployments, where stale HTML can reference retired client chunks.
export const revalidate = 300;
export const dynamicParams = false;

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
  const articleJsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description,
    author: { "@type": "Organization", name: "AION Crypto" }, publisher: { "@type": "Organization", name: "AION Crypto" },
    mainEntityOfPage: `https://aioncrypto.cloud/explained/${guide.slug}`, articleSection: "Crypto Education",
    dateModified: guide.reviewedAt,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "AION Explained", item: "https://aioncrypto.cloud/explained" },
      { "@type": "ListItem", position: 2, name: guide.title, item: `https://aioncrypto.cloud/explained/${guide.slug}` },
    ],
  };
  const faqJsonLd = guide.faq?.length ? {
    "@context": "https://schema.org", "@type": "FAQPage", mainEntity: guide.faq.map((item) => ({
      "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  } : null;
  return <article className="mx-auto max-w-3xl py-7 sm:py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
    <nav className="text-xs text-ink-dim" aria-label="Breadcrumb"><Link href="/explained" className="hover:text-white">AION Explained</Link> / <span className="text-ink">{guide.title}</span></nav>
    <header className="mt-5 border-b border-line pb-7">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-glow">AION Explained</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-5xl">{guide.title}</h1>
      <p className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-base leading-7 text-ink">{guide.answer}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-dim">
        <Link href="/author/aion-crypto" className="hover:text-white">Reviewed by the AION Crypto editorial desk</Link>
        {guide.reviewedAt && <time dateTime={guide.reviewedAt}>Last reviewed {new Date(`${guide.reviewedAt}T00:00:00Z`).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" })}</time>}
      </div>
    </header>
    <div className="mt-8 space-y-9">
      {guide.sections.map((section) => <section key={section.heading}>
        <h2 className="font-display text-2xl font-bold text-white">{section.heading}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 text-[15px] leading-7 text-ink-dim">{paragraph}</p>)}
        {section.points && <ul className="mt-4 space-y-2 text-sm text-ink-dim">{section.points.map((point) => <li key={point} className="rounded-lg border border-line bg-card px-4 py-3">{point}</li>)}</ul>}
      </section>)}
    </div>
    {!!guide.faq?.length && <section className="mt-10 border-t border-line pt-8">
      <h2 className="font-display text-2xl font-bold text-white">Frequently asked questions</h2>
      <div className="mt-4 space-y-4">{guide.faq.map((item) => <div key={item.question} className="rounded-xl border border-line bg-card p-5">
        <h3 className="font-semibold text-white">{item.question}</h3><p className="mt-2 text-sm leading-6 text-ink-dim">{item.answer}</p>
      </div>)}</div>
    </section>}
    {!!guide.sources?.length && <section className="mt-10 border-t border-line pt-8">
      <h2 className="font-display text-2xl font-bold text-white">Primary references</h2>
      <p className="mt-2 text-sm leading-6 text-ink-dim">These references define the protocol, product or safety concepts used in this guide. They are provided for verification, not as endorsements.</p>
      <ul className="mt-4 space-y-2">{guide.sources.map((source) => <li key={source.url}><a href={source.url} rel="noopener noreferrer" className="text-sm text-primary-glow hover:text-white">{source.label} ↗</a></li>)}</ul>
    </section>}
    {!!guide.relatedGuides?.length && <aside className="mt-10 rounded-2xl border border-line bg-card p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-white">Continue learning</h2>
      <div className="mt-3 flex flex-wrap gap-2">{guide.relatedGuides.map((slug) => {
        const related = explainedGuide(slug); return related ? <Link key={slug} href={`/explained/${slug}`} className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:text-white">{related.title}</Link> : null;
      })}</div>
    </aside>}
    {!!guide.relatedCoins?.length && <aside className="mt-10 rounded-2xl border border-line bg-card p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-white">Live data</h2>
      <div className="mt-3 flex flex-wrap gap-2">{guide.relatedCoins.map((symbol) => <Link key={symbol} href={`/crypto/${symbol}`} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-glow">Open {symbol} market hub</Link>)}</div>
    </aside>}
    <p className="mt-8 text-xs leading-5 text-ink-dim">Educational content only. This page does not recommend buying, selling or holding any asset. Verify current product, tax and regulatory details for your jurisdiction.</p>
  </article>;
}
