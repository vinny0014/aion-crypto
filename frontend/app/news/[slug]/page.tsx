import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedArticle, getPublishedArticles } from "../../../lib/api";
import { SITE_URL } from "../../../lib/site";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams() { return []; }

function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function sourceLabel(source: string) {
  try { return new URL(source).hostname; } catch { return source; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getPublishedArticle((await params).slug);
  if (!article) notFound();
  return {
    title: article.title, description: article.summary,
    alternates: { canonical: article.canonical || `/news/${article.slug}` },
    openGraph: { type: "article", title: article.title, description: article.summary, publishedTime: article.published_at, modifiedTime: article.updated_at, images: article.image_url ? [article.image_url] : undefined },
    twitter: { card: "summary_large_image", title: article.title, description: article.summary, images: article.image_url ? [article.image_url] : undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getPublishedArticle((await params).slug);
  if (!article) notFound();
  const all = await getPublishedArticles();
  const related = all.filter((item) => item.id !== article.id && (item.category === article.category || item.related_asset === article.related_asset)).slice(0, 3);
  const paragraphs = article.body.split(/\n{2,}/).filter(Boolean);
  const words = article.body.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  const jsonLd = {
    "@context": "https://schema.org", "@type": "NewsArticle", headline: article.title,
    description: article.summary, articleSection: article.category, datePublished: article.published_at,
    dateModified: article.updated_at, mainEntityOfPage: article.canonical,
    author: { "@type": "Organization", name: article.author, url: "https://aioncrypto.cloud/publisher" },
    publisher: { "@type": "Organization", name: "AION Crypto", url: "https://aioncrypto.cloud" },
    image: article.image_url || undefined,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "News", item: `${SITE_URL}/news` },
      { "@type": "ListItem", position: 3, name: article.title, item: article.canonical },
    ],
  };
  return (
    <article className="mx-auto max-w-3xl py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-xs text-ink-dim"><Link href="/">Home</Link> / <Link href="/news">News</Link> / {article.category}</nav>
      <div className="mt-4 flex gap-2 text-[11px]"><span className="chip">{article.category}</span>{article.related_asset && <Link className="chip" href={`/crypto/${article.related_asset}`}>{article.related_asset}</Link>}</div>
      <h1 className="mt-3 font-display text-3xl font-bold leading-tight">{article.title}</h1>
      {article.subtitle && <p className="mt-3 text-lg text-ink-dim">{article.subtitle}</p>}
      <div className="mt-3 text-[12.5px] text-ink-dim">By <Link href="/author/aion-crypto" className="text-primary-glow">{article.author}</Link> · <time dateTime={article.published_at}>{new Date(article.published_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" })} UTC</time> · Updated {new Date(article.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} · {minutes} min read</div>
      {article.source_published_at && <p className="mt-2 text-xs text-ink-dim">Primary source published <time dateTime={article.source_published_at}>{new Date(article.source_published_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</time>.</p>}
      {article.image_url && <Image src={article.image_url} alt={article.title} width={1200} height={675} unoptimized className="mt-6 aspect-video w-full rounded-xl object-cover" />}
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/90">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      <section className="card mt-8 p-4"><h2 className="font-semibold">Sources</h2><ul className="mt-2 space-y-1 text-sm text-ink-dim">{article.sources.map((source) => <li key={source}><a href={source} rel="nofollow noopener noreferrer" target="_blank" className="break-all text-primary-glow">{sourceLabel(source)}</a></li>)}</ul><Link href="/sources-methodology" className="mt-3 inline-block text-xs text-primary-glow">How we verify sources</Link></section>
      <div className="card mt-4 p-4 text-[12.5px] text-ink-dim"><strong className="text-ink">Financial risk notice.</strong> This content is informational and educational, not personalized financial, investment, legal or tax advice. Crypto assets are volatile and losses are possible.</div>
      <div className="mt-5 flex flex-wrap gap-2 text-xs"><a className="chip" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(article.canonical)}`}>Share on LinkedIn</a><a className="chip" href={`https://t.me/share/url?url=${encodeURIComponent(article.canonical)}&text=${encodeURIComponent(article.title)}`}>Share on Telegram</a><Link className="chip" href="/newsletter">Get alerts</Link></div>
      <p className="mt-5 text-xs text-ink-dim">See an error? Read our <Link href="/corrections-policy" className="text-primary-glow">corrections policy</Link> or <Link href="/contact" className="text-primary-glow">contact us</Link>.</p>
      {related.length > 0 && <><h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide">Related coverage</h2><ul className="mt-3 space-y-2">{related.map((item) => <li key={item.id}><Link href={`/news/${item.slug}`} className="text-[14px] text-ink-dim hover:text-ink">{item.title}</Link></li>)}</ul></>}
      <Link href="/news" className="mt-8 inline-block text-sm text-primary-glow">← Back to news</Link>
    </article>
  );
}
