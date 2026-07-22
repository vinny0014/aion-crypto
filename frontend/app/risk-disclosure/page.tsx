import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Disclosure",
  description: "Crypto asset prices can change dramatically in short periods. Positions can lose most or all of their value.",
  alternates: { canonical: "/risk-disclosure" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Risk Disclosure</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Volatility risk</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Crypto asset prices can change dramatically in short periods. Positions can lose most or all of their value.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Technology risk</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Smart contracts, bridges and wallets can contain bugs or be exploited. Self-custody mistakes are irreversible.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Regulatory risk</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Rules for crypto assets differ by jurisdiction and change frequently, affecting availability, taxation and legality of products.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Liquidity and counterparty risk</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Some assets trade thinly and platforms can fail. Never allocate money you cannot afford to lose.</p>
      </section>
    </div>
  );
}
