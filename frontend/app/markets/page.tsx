import type { Metadata } from "next";
import Link from "next/link";
import { getMarketsTable } from "../../lib/api";
import { CoinDot, Delta, SourceTag, Unavailable } from "../../components/ui";
import { fmtUsd } from "../../lib/format";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Markets — Live Crypto Prices",
  description: "Live cryptocurrency prices, 24h change, volume and ranges for the top assets.",
  alternates: { canonical: "/markets" },
};

export default async function MarketsPage() {
  const table = await getMarketsTable();
  return (
    <div className="py-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Markets</h1>
        <SourceTag p={table} />
      </div>
      <p className="mt-1 text-[13px] text-ink-dim">Live prices for tracked assets. Informational only — not investment advice.</p>
      {table.data ? (
        <div className="card mt-4 overflow-x-auto scroll-thin">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-line text-[11.5px] uppercase tracking-wide text-ink-dim">
              <tr>
                <th className="px-4 py-3">#</th><th className="px-4 py-3">Asset</th>
                <th className="num px-4 py-3 text-right">Price</th>
                <th className="num px-4 py-3 text-right">24h</th>
                <th className="num px-4 py-3 text-right">24h High</th>
                <th className="num px-4 py-3 text-right">24h Low</th>
                <th className="num px-4 py-3 text-right">Volume (24h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {table.data.map((c, i) => (
                <tr key={c.symbol} className="hover:bg-bg-soft/60">
                  <td className="num px-4 py-3 text-ink-dim">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/crypto/${c.symbol}`} className="flex items-center gap-2 font-semibold hover:text-primary-glow">
                      <CoinDot symbol={c.symbol} />{c.name}
                      <span className="text-[11.5px] font-normal text-ink-dim">{c.symbol}</span>
                    </Link>
                  </td>
                  <td className="num px-4 py-3 text-right">{fmtUsd(c.price)}</td>
                  <td className="px-4 py-3 text-right"><Delta value={c.change_24h_pct} /></td>
                  <td className="num px-4 py-3 text-right text-ink-dim">{fmtUsd(c.high_24h)}</td>
                  <td className="num px-4 py-3 text-right text-ink-dim">{fmtUsd(c.low_24h)}</td>
                  <td className="num px-4 py-3 text-right">{fmtUsd(c.volume_24h_quote, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4"><Unavailable what="Market table" /></div>
      )}
    </div>
  );
}
