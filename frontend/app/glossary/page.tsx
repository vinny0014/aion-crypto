import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Airdrop: free token distribution to wallets. AMM: automated market maker, a pricing algorithm used by DEXes. Block: a batch of transactions added to a",
  alternates: { canonical: "/glossary" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Glossary</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">A–D</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Airdrop: free token distribution to wallets. AMM: automated market maker, a pricing algorithm used by DEXes. Block: a batch of transactions added to a chain. Cold wallet: keys stored offline. DEX: decentralized exchange. Dominance: an asset's share of total crypto market cap.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">E–M</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">ETF: exchange-traded fund tracking an asset's price. Gas: fee paid for on-chain computation. Halving: scheduled reduction of new BTC issuance. L2: a network that settles to a base chain to scale it. Market cap: price × circulating supply. MiCA: the EU's crypto asset regulation.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">N–Z</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">On-chain: recorded on a public blockchain. Rollup: an L2 that posts compressed transaction data to L1. Stablecoin: token designed to track a reference asset. TVL: total value locked in a protocol. Volatility: how much a price moves. Whale: a very large holder.</p>
      </section>
    </div>
  );
}
