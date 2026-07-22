import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "We collect the minimum needed to operate the site: server logs for security and reliability, newsletter email addresses you explicitly provide, and — ",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Data we collect</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">We collect the minimum needed to operate the site: server logs for security and reliability, newsletter email addresses you explicitly provide, and — once analytics is configured — aggregate usage statistics. We do not sell personal data.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Newsletter</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Subscribing requires explicit consent and is confirmed via double opt-in. Every email includes a one-click unsubscribe link, and unsubscribing removes you from all sends.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Cookies and analytics</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Analytics is only active when a valid measurement ID is configured. We do not run third-party advertising trackers at this stage.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Your rights</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">You may request access to or deletion of your data at any time via privacy@aioncrypto.cloud.</p>
      </section>
    </div>
  );
}
