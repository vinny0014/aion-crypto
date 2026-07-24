"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FIXTURE_TABLE } from "../../lib/fixtures";
import { fmtUsd } from "../../lib/format";
import { authenticatedFetch, getTokens, verifySession } from "../../lib/auth";
import { Delta } from "../../components/ui";
import { track } from "../../components/Analytics";

const KEY = "aion-crypto-watchlist";
type StorageMode = "account" | "local" | "fallback";

function readLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]; } catch { return []; }
}

export default function WatchlistPage() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<StorageMode>("local");

  useEffect(() => {
    let active = true;
    async function load() {
      const local = readLocal();
      const user = await verifySession();
      if (!user) { if (active) { setSymbols(local); setMode("local"); setLoaded(true); } return; }
      try {
        let response = await authenticatedFetch("/api/v1/watchlist");
        if (!response.ok) throw new Error("watchlist unavailable");
        let remote = (await response.json() as { data: { symbol: string }[] }).data.map((item) => item.symbol);
        for (const symbol of local.filter((symbol) => !remote.includes(symbol))) {
          const migration = await authenticatedFetch("/api/v1/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol }) });
          if (!migration.ok && migration.status !== 409) throw new Error("watchlist migration unavailable");
        }
        if (local.length) {
          response = await authenticatedFetch("/api/v1/watchlist");
          if (!response.ok) throw new Error("watchlist unavailable");
          remote = (await response.json() as { data: { symbol: string }[] }).data.map((item) => item.symbol);
        }
        if (active) { setSymbols(remote); setMode("account"); setLoaded(true); }
      } catch {
        if (active) { setSymbols(local); setMode(getTokens() ? "fallback" : "local"); setLoaded(true); }
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function save(next: string[], action: { add?: string; remove?: string }) {
    if (mode === "account") {
      try {
        const response = await authenticatedFetch(action.add ? "/api/v1/watchlist" : `/api/v1/watchlist/${action.remove}`, {
          method: action.add ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, body: action.add ? JSON.stringify({ symbol: action.add }) : undefined,
        });
        if (!response.ok && response.status !== 409) throw new Error("watchlist unavailable");
        setSymbols(next);
        track(action.add ? "watchlist_add" : "watchlist_remove", { symbol: action.add ?? action.remove ?? "" });
        return;
      } catch { setMode("fallback"); }
    }
    setSymbols(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  const available = useMemo(() => FIXTURE_TABLE.filter((c) => !symbols.includes(c.symbol)), [symbols]);
  const items = symbols.map((s) => FIXTURE_TABLE.find((c) => c.symbol === s)).filter(Boolean) as typeof FIXTURE_TABLE;
  const description = mode === "account" ? "Saved to your account and synced across sessions." : mode === "fallback" ? "Account sync is temporarily unavailable; changes are saved locally in this browser." : "Saved locally in this browser. Sign in to sync across devices.";

  return <div className="mx-auto max-w-3xl py-6">
    <h1 className="font-display text-2xl font-bold">Watchlist</h1>
    <p className="mt-1 text-[13px] text-ink-dim">{description} Reference prices shown; live watchlist pricing connects to the market API.</p>
    {!loaded ? null : items.length === 0 ? <div className="card mt-5 p-6 text-center text-[14px] text-ink-dim">Your watchlist is empty — add a coin below to start tracking it.</div> : <ul className="card mt-5 divide-y divide-line">
      {items.map((c) => <li key={c.symbol} className="flex items-center gap-3 px-4 py-3">
        <Link href={`/crypto/${c.symbol}`} className="font-semibold hover:text-primary-glow">{c.name} <span className="text-ink-dim">{c.symbol}</span></Link><span className="num ml-auto">{fmtUsd(c.price)}</span><Delta value={c.change_24h_pct} />
        <button className="ml-2 rounded-md border border-line px-2 py-1 text-[12px] text-ink-dim hover:text-accent-red" onClick={() => void save(symbols.filter((s) => s !== c.symbol), { remove: c.symbol })}>Remove</button>
      </li>)}</ul>}
    <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide">Add coins</h2><div className="mt-3 flex flex-wrap gap-2">{available.map((c) => <button key={c.symbol} onClick={() => void save([...symbols, c.symbol], { add: c.symbol })} className="chip hover:border-primary hover:text-ink">+ {c.symbol}</button>)}</div>
  </div>;
}
