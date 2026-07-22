import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <div className="font-display text-6xl font-bold text-primary-glow">404</div>
      <h1 className="mt-3 text-xl font-semibold">This page doesn't exist</h1>
      <p className="mt-2 max-w-sm text-[14px] text-ink-dim">The link may be outdated, or the coin/article was not found. Try the markets overview or search.</p>
      <div className="mt-5 flex gap-3">
        <Link href="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-glow">Go home</Link>
        <Link href="/search" className="rounded-lg border border-line px-4 py-2 text-sm text-ink-dim hover:text-ink">Search</Link>
      </div>
    </div>
  );
}
