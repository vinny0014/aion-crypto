import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "Every news item must trace to an identifiable, credible source — official announcements, regulatory filings, primary documents or reputable outlets — ",
  alternates: { canonical: "/editorial-policy" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Editorial Policy</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Sourcing</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Every news item must trace to an identifiable, credible source — official announcements, regulatory filings, primary documents or reputable outlets — and carry its publication date.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Automation with oversight</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Parts of our pipeline are automated. Automated drafts pass verification checks (facts, market numbers, duplication, links, disclaimers) before publication, and automated summaries are labeled as such.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Separation of content types</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">News reports facts. Analysis interprets them and is labeled as analysis. Nothing we publish is a personalized recommendation.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Corrections</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Material errors are corrected promptly and transparently — see our Corrections Policy.</p>
      </section>
    </div>
  );
}
