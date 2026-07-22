import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status",
  description: "Frontend: operational. Backend API and market data sources report their status through the /health endpoint and are surfaced on every data block via s",
  alternates: { canonical: "/status" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">System Status</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Live status</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Frontend: operational. Backend API and market data sources report their status through the /health endpoint and are surfaced on every data block via source labels (live, stale, sample, unavailable).</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Data provenance</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">live = fresh from Binance/CoinGecko · stale = last valid value while sources recover · sample = development fixture with backend offline · unavailable = shown explicitly, never replaced with fabricated numbers.</p>
      </section>
    </div>
  );
}
