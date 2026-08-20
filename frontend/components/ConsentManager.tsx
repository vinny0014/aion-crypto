"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { googleConsentUpdate, readConsent, saveConsent, type ConsentChoice } from "../lib/consent";

export default function ConsentManager() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    const saved = readConsent();
    if (saved) {
      setAnalytics(saved.analytics);
      setAdvertising(saved.advertising);
      googleConsentUpdate(saved);
    } else setVisible(true);
    const reopen = () => setVisible(true);
    window.addEventListener("aion-open-consent", reopen);
    return () => window.removeEventListener("aion-open-consent", reopen);
  }, []);

  function choose(choice: Pick<ConsentChoice, "analytics" | "advertising">) {
    saveConsent(choice);
    setAnalytics(choice.analytics);
    setAdvertising(choice.advertising);
    setVisible(false);
    setCustomizing(false);
  }

  if (!visible) return <button type="button" onClick={() => setVisible(true)} className="fixed bottom-3 right-3 z-50 rounded-full border border-line bg-bg-soft px-3 py-2 text-[11px] font-semibold text-ink shadow-card hover:border-primary" aria-label="Open cookie preferences">Cookie settings</button>;

  return <section id="cookie-preferences" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-primary/40 bg-bg-soft p-4 shadow-2xl sm:p-5" role="dialog" aria-modal="true" aria-labelledby="consent-title">
    <h2 id="consent-title" className="font-display text-lg font-bold text-white">Your privacy choices</h2>
    <p className="mt-2 text-xs leading-5 text-ink-dim">Essential storage keeps requested features working. Analytics and advertising remain off unless you choose them. Learn more in our <Link href="/privacy" className="text-primary-glow">Privacy Policy</Link> and <Link href="/cookie-policy" className="text-primary-glow">Cookie Policy</Link>.</p>
    {customizing && <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="rounded-xl border border-line bg-card p-3 text-sm text-ink"><span className="flex items-center gap-2"><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> Analytics</span><span className="mt-1 block text-[11px] leading-4 text-ink-dim">Helps us understand aggregate site use.</span></label>
      <label className="rounded-xl border border-line bg-card p-3 text-sm text-ink"><span className="flex items-center gap-2"><input type="checkbox" checked={advertising} onChange={(event) => setAdvertising(event.target.checked)} /> Advertising</span><span className="mt-1 block text-[11px] leading-4 text-ink-dim">Permits Google advertising storage only after activation.</span></label>
    </div>}
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={() => choose({ analytics: true, advertising: true })} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-glow">Accept all</button>
      <button type="button" onClick={() => choose({ analytics: false, advertising: false })} className="rounded-lg border border-line px-4 py-2 text-xs font-bold text-ink hover:text-white">Reject optional</button>
      {customizing ? <button type="button" onClick={() => choose({ analytics, advertising })} className="rounded-lg border border-primary/50 px-4 py-2 text-xs font-bold text-primary-glow">Save choices</button> : <button type="button" onClick={() => setCustomizing(true)} className="rounded-lg border border-line px-4 py-2 text-xs font-bold text-ink hover:text-white">Personalize</button>}
    </div>
  </section>;
}
