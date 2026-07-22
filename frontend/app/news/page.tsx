import type { Metadata } from "next";
import Link from "next/link";
import { FIXTURE_ARTICLES } from "@/lib/fixtures";

export const metadata: Metadata = {
  title: "News",
  description: "Crypto market news and coverage from AION Crypto.",
  alternates: { canonical: "/news" },
};

export default function NewsPage() {
  return (
    <div className="py-5">
      <h1 className="font-display text-2xl font-bold">News</h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Development preview: template articles shown below. The editorial pipeline replaces these with sourced, verified coverage.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FIXTURE_ARTICLES.map((a) => (
          <Link key={a.slug} href={`/news/${a.slug}`} className="card group p-5">
            <div className="flex gap-2 text-[11px]"><span className="chip">{a.category}</span><span className="chip">{a.tag}</span></div>
            <h2 className="mt-3 text-[16px] font-semibold leading-snug group-hover:text-primary-glow">{a.title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">{a.summary}</p>
            <div className="mt-3 text-[11.5px] text-ink-dim">{a.hoursAgo}h ago · {a.minutes} min read</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
