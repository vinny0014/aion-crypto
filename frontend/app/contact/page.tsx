import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "For corrections, tips or press inquiries, write to editorial@aioncrypto.cloud. We aim to respond within two business days.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Contact</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Editorial</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">For corrections, tips or press inquiries, write to editorial@aioncrypto.cloud. We aim to respond within two business days.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Partnerships</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">For partnership or advertising inquiries, write to partners@aioncrypto.cloud.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Security</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Found a vulnerability? Please report it responsibly to security@aioncrypto.cloud. Do not open public issues for security reports.</p>
      </section>
    </div>
  );
}
