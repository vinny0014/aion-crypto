import type { Metadata } from "next";
import NewsletterSignup from "../../components/NewsletterSignup";

export const metadata: Metadata = { title: "Crypto alerts", description: "Choose AION Crypto breaking-news and market alert preferences.", alternates: { canonical: "/newsletter" } };

export default function NewsletterPage() {
  return <div className="mx-auto max-w-xl py-8"><h1 className="font-display text-2xl font-bold">Crypto news and market alerts</h1><p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Choose only the updates you want. Subscription requires explicit consent and confirmation; no paid email platform is active.</p><NewsletterSignup /><p className="mt-3 text-[11.5px] text-ink-dim">We store your email, consent time, source and selected preferences. See our Privacy and Cookie policies.</p></div>;
}
