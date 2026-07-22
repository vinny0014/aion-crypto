import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About AION Crypto",
  description: "AION Crypto is a crypto market intelligence portal. We combine real-time market data from public exchange APIs with news, analysis and educational gui",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">About AION Crypto</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">What we do</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">AION Crypto is a crypto market intelligence portal. We combine real-time market data from public exchange APIs with news, analysis and educational guides, so readers can understand what is happening in crypto markets and why.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">How we work</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Market data comes from public APIs (Binance, with CoinGecko as fallback) and is always labeled with its source and freshness. Editorial content follows our editorial policy: sourced, dated, and clearly separated from opinion.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">What we are not</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">We do not execute trades, hold customer funds, or provide personalized financial advice. Everything published here is informational.</p>
      </section>
    </div>
  );
}
