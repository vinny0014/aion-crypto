import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "AION Crypto publishes market data, news and analysis for informational and educational purposes. We are not a broker, exchange, or investment adviser.",
  alternates: { canonical: "/disclaimer" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Disclaimer</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Informational only</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">AION Crypto publishes market data, news and analysis for informational and educational purposes. We are not a broker, exchange, or investment adviser.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Market data</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Prices and metrics come from public third-party APIs and may be delayed, incomplete or temporarily unavailable. Data provenance and freshness are labeled throughout the site.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">No guarantees</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Past performance does not guarantee future results. Crypto assets are highly volatile and you can lose your entire investment.</p>
      </section>
    </div>
  );
}
