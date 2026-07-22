import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn Crypto",
  description: "New to crypto? Begin with how blockchains reach consensus, what a wallet actually stores, and the difference between coins and tokens. Our glossary de",
  alternates: { canonical: "/learn" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Learn Crypto</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Start here</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">New to crypto? Begin with how blockchains reach consensus, what a wallet actually stores, and the difference between coins and tokens. Our glossary defines every term we use.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Core concepts</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Understand market cap versus price, why circulating supply matters, how order books and AMMs set prices, and what dominance metrics tell you about market structure.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Staying safe</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Before moving real money: learn self-custody basics, how to verify contracts and URLs, and why 'not your keys, not your coins' is only half the story — operational security is the other half.</p>
      </section>
    </div>
  );
}
