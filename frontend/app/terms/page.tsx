import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "By using AION Crypto you agree to these terms. If you do not agree, please do not use the site.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Terms of Service</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Acceptance</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">By using AION Crypto you agree to these terms. If you do not agree, please do not use the site.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Content</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">All content is provided &quot;as is&quot; for informational purposes. We work to keep data accurate and labeled with its source, but markets move fast and data may be delayed or unavailable.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">No advice</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Nothing on this site is financial, investment, legal or tax advice, and no content should be read as a recommendation to buy or sell any asset.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Limitation of liability</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">To the maximum extent permitted by law, AION Crypto is not liable for losses arising from the use of information on this site.</p>
      </section>
    </div>
  );
}
