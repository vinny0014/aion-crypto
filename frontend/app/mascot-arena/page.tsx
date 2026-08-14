import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Crypto Character Arena",
  description:
    "Meet AION Crypto's cinematic character collection, with ten original guardians inspired by leading blockchain networks.",
  alternates: { canonical: "/mascot-arena" },
  openGraph: {
    title: "AION Crypto Character Arena",
    description:
      "Ten original cinematic guardians inspired by Bitcoin, Ethereum, XRP, Solana and other leading networks.",
    url: "/mascot-arena",
    type: "website",
  },
};

const CHARACTERS = [
  {
    coin: "Bitcoin",
    symbol: "BTC",
    title: "The Viking King",
    role: "Guardian of digital scarcity",
    image: "/mascots/bitcoin-viking-king-v2.webp",
    accent: "from-amber-400/30 via-orange-500/10 to-transparent",
    border: "hover:border-amber-400/60",
    lore:
      "Forged in discipline and protected by an unmistakable golden shield, the Viking King represents resilience, sovereignty and Bitcoin's fixed supply.",
  },
  {
    coin: "Ethereum",
    symbol: "ETH",
    title: "The Sovereign",
    role: "Architect of programmable worlds",
    image: "/mascots/ethereum-sovereign.webp",
    accent: "from-violet-400/30 via-indigo-500/10 to-transparent",
    border: "hover:border-violet-400/60",
    lore:
      "The Sovereign commands a crystalline city where code becomes infrastructure, embodying Ethereum's role as a foundation for decentralized applications.",
  },
  {
    coin: "XRP",
    symbol: "XRP",
    title: "The Velocity Guardian",
    role: "Sentinel of global value transfer",
    image: "/mascots/xrp-velocity-guardian.webp",
    accent: "from-slate-200/25 via-sky-400/10 to-transparent",
    border: "hover:border-sky-300/60",
    lore:
      "Built for precision and speed, the Velocity Guardian watches over luminous routes connecting markets and communities across the world.",
  },
  {
    coin: "Solana",
    symbol: "SOL",
    title: "The Neon Ronin",
    role: "Warrior of parallel execution",
    image: "/mascots/solana-neon-ronin.webp",
    accent: "from-cyan-400/25 via-fuchsia-500/15 to-transparent",
    border: "hover:border-fuchsia-400/60",
    lore:
      "The Neon Ronin moves through a rain-lit city with disciplined speed, reflecting Solana's high-throughput design and ambitious ecosystem.",
  },
  {
    coin: "BNB",
    symbol: "BNB",
    title: "The Golden Architect",
    role: "Builder of a vast ecosystem",
    image: "/mascots/bnb-golden-architect.webp",
    accent: "from-yellow-400/30 via-amber-500/10 to-transparent",
    border: "hover:border-yellow-400/60",
    lore:
      "The Golden Architect unites infrastructure, utility and scale inside a monumental black-and-gold citadel.",
  },
  {
    coin: "Dogecoin",
    symbol: "DOGE",
    title: "The Lunar Captain",
    role: "Explorer powered by community",
    image: "/mascots/dogecoin-lunar-captain.webp",
    accent: "from-amber-300/25 via-yellow-600/10 to-transparent",
    border: "hover:border-amber-300/60",
    lore:
      "Optimistic, loyal and ready for the next mission, the Lunar Captain celebrates the culture and community energy behind Dogecoin.",
  },
  {
    coin: "Cardano",
    symbol: "ADA",
    title: "The Celestial Scholar",
    role: "Strategist of rigorous systems",
    image: "/mascots/cardano-celestial-scholar.webp",
    accent: "from-blue-400/25 via-cyan-500/10 to-transparent",
    border: "hover:border-blue-400/60",
    lore:
      "Guided by research and a constellation of carefully arranged nodes, the Celestial Scholar represents methodical engineering and long-term vision.",
  },
  {
    coin: "Chainlink",
    symbol: "LINK",
    title: "The Oracle Sentinel",
    role: "Guardian of verifiable data",
    image: "/mascots/chainlink-oracle-sentinel.webp",
    accent: "from-blue-500/25 via-sky-400/10 to-transparent",
    border: "hover:border-blue-500/60",
    lore:
      "Standing between digital kingdoms and the real world, the Oracle Sentinel protects the secure bridges that carry trusted information.",
  },
  {
    coin: "Avalanche",
    symbol: "AVAX",
    title: "The Crimson Mountaineer",
    role: "Champion of rapid finality",
    image: "/mascots/avalanche-crimson-mountaineer.webp",
    accent: "from-red-500/30 via-rose-500/10 to-transparent",
    border: "hover:border-red-400/60",
    lore:
      "The Crimson Mountaineer holds the summit through speed, resilience and decisive finality across a landscape of connected networks.",
  },
  {
    coin: "Polkadot",
    symbol: "DOT",
    title: "The Multiverse Conductor",
    role: "Commander of connected worlds",
    image: "/mascots/polkadot-multiverse-conductor.webp",
    accent: "from-pink-500/30 via-fuchsia-500/10 to-transparent",
    border: "hover:border-pink-400/60",
    lore:
      "With many sovereign worlds moving in harmony, the Multiverse Conductor symbolizes interoperability and shared security.",
  },
] as const;

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AION Crypto Character Arena",
  numberOfItems: CHARACTERS.length,
  itemListElement: CHARACTERS.map((character, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: `${character.coin} — ${character.title}`,
    url: `/mascot-arena#${character.symbol.toLowerCase()}`,
  })),
};

export default function MascotArenaPage() {
  return (
    <div className="pb-20 pt-8 sm:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <section className="relative isolate overflow-hidden rounded-3xl border border-line bg-card px-5 py-12 text-center shadow-card sm:px-10 sm:py-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(124,58,237,.28),transparent_48%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,.16),transparent_38%)]" />
        <span className="chip border-primary/40 text-primary-glow">AION ORIGINAL COLLECTION</span>
        <h1 className="mx-auto mt-5 max-w-4xl font-display text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Crypto Character Arena
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-ink-dim sm:text-lg">
          Ten cinematic guardians. Ten distinct blockchain identities. One original visual universe
          built for the AION Crypto community.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CHARACTERS.map((character) => (
            <a
              key={character.symbol}
              href={`#${character.symbol.toLowerCase()}`}
              className="rounded-full border border-line bg-bg/70 px-3 py-1.5 text-xs font-semibold text-ink-dim hover:border-primary/60 hover:text-white"
            >
              {character.symbol}
            </a>
          ))}
        </div>
      </section>

      <section
        className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="AION Crypto characters"
      >
        {CHARACTERS.map((character, index) => (
          <article
            id={character.symbol.toLowerCase()}
            key={character.symbol}
            className={`group scroll-mt-28 overflow-hidden rounded-2xl border border-line bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${character.border}`}
          >
            <div className="relative aspect-[2/3] overflow-hidden bg-bg-soft">
              <Image
                src={character.image}
                alt={`${character.title}, AION Crypto character inspired by ${character.coin}`}
                width={1024}
                height={1536}
                priority={index === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
              />
              <div className={`absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t ${character.accent}`} />
              <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/65 px-3 py-1 text-xs font-bold tracking-[0.18em] text-white backdrop-blur">
                {character.symbol}
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">
                {character.coin}
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-white">
                {character.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-ink">{character.role}</p>
              <p className="mt-4 text-sm leading-6 text-ink-dim">{character.lore}</p>
            </div>
          </article>
        ))}
      </section>

      <aside className="mt-10 rounded-2xl border border-line bg-bg-soft p-5 text-sm leading-6 text-ink-dim sm:p-6">
        <strong className="text-ink">Editorial note:</strong> These are original fictional characters
        created by AION Crypto for education and entertainment. They do not represent endorsements by
        blockchain foundations and are not investment recommendations.
      </aside>
    </div>
  );
}
