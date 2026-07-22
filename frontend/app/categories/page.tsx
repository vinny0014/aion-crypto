import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categories",
  description: "Markets — price action and flows. Technology — protocol upgrades and infrastructure. Regulation — laws and policy. Analysis — interpretation. Guides —",
  alternates: { canonical: "/categories" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="font-display text-2xl font-bold">Categories</h1>
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold">Browse by category</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">Markets — price action and flows. Technology — protocol upgrades and infrastructure. Regulation — laws and policy. Analysis — interpretation. Guides — evergreen how-tos. Each article on the site is tagged with exactly one category, shown on its card.</p>
      </section>
    </div>
  );
}
