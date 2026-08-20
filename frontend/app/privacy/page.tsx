import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AION Crypto handles server logs, newsletter details, aggregate analytics and privacy rights while minimizing collected data.",
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
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Subscribing requires explicit consent. Confirmation and unsubscribe tokens are stored only as hashes. Email delivery remains disabled until a safe channel is connected; when sending is enabled, confirmation must occur before any alert and every message must include an unsubscribe link.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Cookies and analytics</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Optional analytics and advertising storage is denied by default. Google Analytics loads only after you grant analytics consent. If Google AdSense is activated later, its script and advertising storage will load only after advertising consent. You can reject, accept or change these choices through Cookie settings.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Google services</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">With your permission, Google may process device, browser and usage information to provide aggregate measurement or advertising. Google acts as a third-party provider under its own privacy terms. We do not send email addresses or other direct identifiers in analytics events.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Your rights</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">You may request access to or deletion of your data at any time via privacy@aioncrypto.cloud.</p>
      </section>
    </div>
  );
}
