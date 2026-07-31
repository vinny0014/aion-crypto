import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "../../lib/api";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const articles = await getPublishedArticles();
  return {
    title: "Crypto News",
    description: "Sourced and verified cryptocurrency news from AION Crypto.",
    alternates: { canonical: "/news" },
    robots: articles.length ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function NewsPage() {
  const articles = await getPublishedArticles();
  return (
    <div className="py-5">
      <h1 className="font-display text-2xl font-bold">Crypto News</h1>
      <p className="mt-1 text-[13px] text-ink-dim">Original coverage with visible sources, dates and editorial checks.</p>
      {articles.length === 0 ? (
        <div className="card mt-5 p-5 text-sm text-ink-dim">No verified articles are published yet. Market pages remain available while the editorial desk completes its source and quality checks.</div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`} className="card group p-5">
              <div className="flex gap-2 text-[11px]"><span className="chip">{article.category}</span>{article.related_asset && <span className="chip">{article.related_asset}</span>}</div>
              <h2 className="mt-3 text-[16px] font-semibold leading-snug group-hover:text-primary-glow">{article.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">{article.summary}</p>
              <time className="mt-3 block text-[11.5px] text-ink-dim" dateTime={article.published_at}>{new Date(article.published_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</time>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
