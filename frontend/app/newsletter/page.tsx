import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Weekly crypto market intelligence from AION Crypto.",
  alternates: { canonical: "/newsletter" },
};

export default function NewsletterPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email;
  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="font-display text-2xl font-bold">AION Crypto Weekly</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
        One email per week: market structure, the stories that mattered, and one thing worth learning. No hype, no spam, unsubscribe anytime with one click.
      </p>
      <div className="card mt-6 p-5">
        {email ? (
          <p className="text-[14px]">
            <strong>{email}</strong> noted. Email delivery activates once our sending infrastructure (SMTP) is configured — we use double opt-in, so you'll receive a confirmation email first and are only subscribed after confirming.
          </p>
        ) : (
          <form action="/newsletter" method="get" className="flex gap-2">
            <input type="email" name="email" required placeholder="you@example.com" aria-label="Email address"
              className="w-full rounded-lg border border-line bg-bg-soft px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-glow">Subscribe</button>
          </form>
        )}
        <p className="mt-3 text-[11.5px] text-ink-dim">
          By subscribing you consent to receive the weekly newsletter. We store only your email and consent record. See our Privacy Policy.
        </p>
      </div>
    </div>
  );
}
