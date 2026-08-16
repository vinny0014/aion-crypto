export default function PolicyPage({ title, intro, sections }: { title: string; intro: string; sections: [string, string][] }) {
  return <div className="mx-auto max-w-3xl py-6"><h1 className="font-display text-2xl font-bold">{title}</h1><p className="mt-3 text-[14px] leading-relaxed text-ink-dim">{intro}</p>{sections.map(([heading, body]) => <section className="mt-6" key={heading}><h2 className="text-[15px] font-semibold">{heading}</h2><p className="mt-2 text-[14px] leading-relaxed text-ink-dim">{body}</p></section>)}</div>;
}
