"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FIXTURE_TABLE } from "@/lib/fixtures";
import { fmtUsd } from "@/lib/format";
import { Delta } from "@/components/ui";

const KEY = "aion-crypto-watchlist";

export default function WatchlistPage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { setSymbols(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* fresh start */ }
    setLoaded(true);
  }, []);

  const save = (next: string[]) => {
    setSymbols(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const available = useMemo(() => FIXTURE_TABLE.filter((c) => !symbols.includes(c.symbol)), [symbols]);
  const items = symbols.map((s) => FIXTURE_TABLE.find((c) => c.symbol === s)).filter(Boolean) as typeof FIXTURE_TABLE;

  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Watchlist</h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Saved locally in your browser. Sign in (coming with accounts) to sync across devices. Reference prices shown; live watchlist pricing connects to the market API.
      </p>
      {!loaded ? null : items.length === 0 ? (
        <div className="card mt-5 p-6 text-center text-[14px] text-ink-dim">
          Your watchlist is empty — add a coin below to start tracking it.
        </div>
      ) : (
        <ul className="card mt-5 divide-y divide-line">
          {items.map((c, i) => (
            <li key={c.symbol} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col gap-1">
                <button aria-label={`Move ${c.symbol} up`} disabled={i === 0} className="text-ink-dim disabled:opacity-30"
                  onClick={() => { const n = [...symbols]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; save(n); }}>▲</button>
                <button aria-label={`Move ${c.symbol} down`} disabled={i === items.length - 1} className="text-ink-dim disabled:opacity-30"
                  onClick={() => { const n = [...symbols]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; save(n); }}>▼</button>
              </div>
              <Link href={`/crypto/${c.symbol}`} className="font-semibold hover:text-primary-glow">{c.name} <span className="text-ink-dim">{c.symbol}</span></Link>
              <span className="num ml-auto">{fmtUsd(c.price)}</span>
              <Delta value={c.change_24h_pct} />
              <button
                className="ml-2 rounded-md border border-line px-2 py-1 text-[12px] text-ink-dim hover:text-accent-red"
                onClick={() => save(symbols.filter((s) => s !== c.symbol))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide">Add coins</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {available.map((c) => (
          <button key={c.symbol} onClick={() => save([...symbols, c.symbol])} className="chip hover:border-primary hover:text-ink">
            + {c.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
