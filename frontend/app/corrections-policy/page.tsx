import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description: "Anyone can flag an error via editorial@aioncrypto.example. Include the article link and the issue.",
  alternates: { canonical: "/corrections-policy" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Corrections Policy</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Reporting an error</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Anyone can flag an error via editorial@aioncrypto.example. Include the article link and the issue.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">How we correct</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Verified factual errors are fixed in the article with a dated correction note. If a story is fundamentally wrong, we retract it and say why.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Data corrections</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Erroneous market data is replaced as soon as the upstream source corrects it; stale data is always labeled as stale rather than silently shown as live.</p>
      </section>
    </div>
  );
}
