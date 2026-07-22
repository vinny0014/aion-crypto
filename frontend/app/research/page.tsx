import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research",
  description: "Longer-form research on protocols, sectors and market structure. Research pieces include data sources, methodology and limitations.",
  alternates: { canonical: "/research" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Research</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Deep dives</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Longer-form research on protocols, sectors and market structure. Research pieces include data sources, methodology and limitations.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">In progress</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">The research section is being seeded. Meanwhile, see Analysis for current interpretive coverage and Guides for evergreen material.</p>
      </section>
    </div>
  );
}
