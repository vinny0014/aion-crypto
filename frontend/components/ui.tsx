import Link from "next/link";
import type { Provenance } from "../lib/api";
import { fmtPct, timeAgo } from "../lib/format";

export function Delta({ value, className = "" }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className={`text-ink-dim ${className}`}>—</span>;
  const up = value >= 0;
  return (
    <span className={`num font-medium ${up ? "text-accent-green" : "text-accent-red"} ${className}`}>
      {up ? "▲" : "▼"} {fmtPct(Math.abs(value)).replace("+", "")}
    </span>
  );
}

export function SectionTitle({
  children,
  href,
  linkLabel = "View All",
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink">{children}</h2>
      {href && (
        <Link href={href} className="text-[12px] font-medium text-primary-glow hover:text-ink">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/** Provenance badge — every market block shows where data came from. */
export function SourceTag({ p }: { p: Provenance }) {
  const label =
    p.status === "live" ? `${p.source} · ${timeAgo(p.fetched_at)}` :
    p.status === "stale" ? `${p.source} · stale` :
    p.status === "sample" ? "Sample data · backend offline" :
    "Live API connected · market data temporarily unavailable";
  const tone =
    p.status === "live" ? "text-accent-green" :
    p.status === "stale" ? "text-accent-btc" :
    "text-ink-dim";
  return <span className={`chip ${tone}`}>{label}</span>;
}

export function Unavailable({ what = "Data" }: { what?: string }) {
  return (
    <div className="flex h-full min-h-[80px] items-center justify-center rounded-lg border border-dashed border-line text-[13px] text-ink-dim">
      {what} temporarily unavailable — retrying automatically.
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-bg-soft ${className}`} />;
}

export function CoinDot({ symbol }: { symbol: string }) {
  const colors: Record<string, string> = {
    BTC: "bg-accent-btc", ETH: "bg-primary-glow", SOL: "bg-accent-cyan", XRP: "bg-ink-dim",
    BNB: "bg-accent-btc", DOGE: "bg-accent-btc", ADA: "bg-accent-cyan", LINK: "bg-primary",
  };
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${colors[symbol] ?? "bg-primary"} text-[9px] font-bold text-bg`}>
      {symbol.slice(0, 1)}
    </span>
  );
}
