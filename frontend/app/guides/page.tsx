import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guides",
  description: "Step-by-step guides on wallets, self-custody, reading charts, evaluating projects, and understanding on-chain data. Each guide is dated and reviewed p",
  alternates: { canonical: "/guides" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Guides</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Practical, evergreen guides</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Step-by-step guides on wallets, self-custody, reading charts, evaluating projects, and understanding on-chain data. Each guide is dated and reviewed periodically.</p>
      </section>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Featured guide: Self-custody basics</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Most self-custody losses come from operational mistakes, not exotic hacks. Our security checklist covers seed phrase handling, hardware wallets, and transaction verification. Read it in News → 'Self-Custody Basics: A Practical Security Checklist'.</p>
      </section>
    </div>
  );
}
