import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tags",
  description: "BITCOIN · ETHEREUM · ALTCOINS · DEFI · REGULATION · GUIDE. Tags appear on every article card and article page; tag landing pages with filtered feeds s",
  alternates: { canonical: "/tags" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Tags</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Browse by tag</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">BITCOIN · ETHEREUM · ALTCOINS · DEFI · REGULATION · GUIDE. Tags appear on every article card and article page; tag landing pages with filtered feeds ship with the editorial pipeline.</p>
      </section>
    </div>
  );
}
