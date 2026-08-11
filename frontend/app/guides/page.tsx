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
        <h2 className="text-[15px] font-semibold">Publication standard</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">A guide is listed only after it contains complete, sourced and dated material. Development outlines and fixture articles are not presented as published guidance.</p>
      </section>
    </div>
  );
}
