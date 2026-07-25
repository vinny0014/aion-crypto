"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTokens, logout, resolveSession, type SessionState } from "../lib/auth";

const NAV = [
  ["Markets", "/markets"], ["News", "/news"], ["Coins", "/coins"], ["Analysis", "/analysis"],
  ["Research", "/research"], ["Guides", "/guides"], ["Learn", "/learn"], ["Glossary", "/glossary"],
] as const;

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="AION Crypto home">
      <span className="glow-ring flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-white">
        A
      </span>
      <span className="font-display text-lg font-bold leading-none tracking-tight">
        AION <span className="text-primary-glow">CRYPTO</span>
      </span>
      <span className="chip hidden sm:inline-flex border-primary/40 text-primary-glow">AI</span>
    </Link>
  );
}

export default function Header() {
  const [session, setSession] = useState<SessionState>({ status: "signed_out" });
  const [hasTokens, setHasTokens] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    // read storage on the client only, to avoid a hydration mismatch
    setHasTokens(Boolean(getTokens()));
    void resolveSession().then((state) => {
      if (!active) return;
      setSession(state);
      setHasTokens(Boolean(getTokens()));
      setChecking(false);
    });
    return () => { active = false; };
  }, []);

  async function onLogout() {
    await logout();
    setSession({ status: "signed_out" });
    setHasTokens(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-3 sm:px-5">
        <Logo />
        <form action="/search" className="hidden min-w-0 flex-1 justify-center md:flex">
          <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-line bg-bg-soft px-3 py-1.5">
            <span aria-hidden className="text-ink-dim">⌕</span>
            <input
              name="q"
              placeholder="Search coins, news, categories, topics…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
              aria-label="Search"
            />
            <kbd className="chip">Ctrl /</kbd>
          </div>
        </form>
        <nav className="ml-auto flex items-center gap-2 text-sm">
          <Link href="/watchlist" className="chip hover:text-ink">☆ Watchlist</Link>
          <Link href="/newsletter" className="chip hidden hover:text-ink sm:inline-flex">✉ Newsletter</Link>
          {session.status === "authenticated" ? <>
            {(session.user.role === "admin" || session.user.role === "editor") && <Link href="/admin" className="chip hover:text-ink">Admin</Link>}
            <button onClick={() => void onLogout()} className="rounded-lg border border-line px-3 py-1.5 font-medium text-ink hover:border-primary" aria-label="Sign out">Sign out</button>
          </> : hasTokens && (checking || session.status === "backend_unreachable") ? (
            // tokens are intact and the backend simply has not answered yet:
            // showing "Sign in" here would look like an involuntary logout
            <span className="chip text-accent-btc" role="status" aria-live="polite">Reconnecting…</span>
          ) : <Link href="/login" className="rounded-lg bg-primary px-3 py-1.5 font-medium text-white shadow-glow hover:bg-primary-glow">Sign in</Link>}
        </nav>
      </div>
      <nav className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-3 pb-2 sm:px-5 scroll-thin" aria-label="Sections">
        {NAV.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="whitespace-nowrap rounded-md px-3 py-1 text-[13px] font-medium text-ink-dim hover:bg-bg-soft hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
