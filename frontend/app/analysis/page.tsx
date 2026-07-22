import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analysis",
  description: "Interpretation of market structure, flows and on-chain data — clearly labeled as analysis, never as advice. Current pieces are listed under News with ",
  alternates: { canonical: "/analysis" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Analysis</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Market analysis</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Interpretation of market structure, flows and on-chain data — clearly labeled as analysis, never as advice. Current pieces are listed under News with the Analysis category.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Methodology</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Our analysis starts from verifiable data: exchange volumes, ETF flow reports, on-chain metrics and derivatives positioning. Sources and dates are cited in every piece.</p>
      </section>
    </div>
  );
}
