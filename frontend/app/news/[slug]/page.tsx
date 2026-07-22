import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FIXTURE_ARTICLES } from "@/lib/fixtures";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return FIXTURE_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = FIXTURE_ARTICLES.find((x) => x.slug === slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: `/news/${a.slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = FIXTURE_ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title,
    description: a.summary,
    articleSection: a.category,
    author: { "@type": "Organization", name: "AION Crypto" },
  };
  const more = FIXTURE_ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3);
  return (
    <article className="mx-auto max-w-3xl py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex gap-2 text-[11px]"><span className="chip">{a.category}</span><span className="chip">{a.tag}</span></div>
      <h1 className="mt-3 font-display text-3xl font-bold leading-tight">{a.title}</h1>
      <div className="mt-3 text-[12.5px] text-ink-dim">AION Crypto Desk · {a.hoursAgo}h ago · {a.minutes} min read</div>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/90">
        {a.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
      </div>
      <div className="card mt-8 p-4 text-[12.5px] text-ink-dim">
        <strong className="text-ink">Disclaimer.</strong> AION Crypto content is informational and educational. It is not financial, investment, legal or tax advice. Crypto assets are volatile and you can lose money.
      </div>
      <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide">More coverage</h2>
      <ul className="mt-3 space-y-2">
        {more.map((m) => (
          <li key={m.slug}><Link href={`/news/${m.slug}`} className="text-[14px] text-ink-dim hover:text-ink">{m.title}</Link></li>
        ))}
      </ul>
    </article>
  );
}
