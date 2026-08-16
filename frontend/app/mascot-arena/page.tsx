import type { Metadata } from "next";
import MascotArenaClient from "../../components/MascotArenaClient";
import { MASCOTS } from "../../lib/mascots";

export const metadata: Metadata = {
  title: "Mascot Arena — Battle for the Crown",
  description: "Vote in the AION Crypto Mascot Arena. Follow the live weekly ranking for 15 original crypto characters.",
  keywords: ["crypto mascots", "cryptocurrency characters", "Bitcoin mascot", "Ethereum mascot", "XRP mascot", "crypto character arena"],
  alternates: { canonical: "/mascot-arena" },
  openGraph: {
    title: "Mascot Arena — Battle for the Crown",
    description: "Fifteen crypto mascots. One weekly champion. Choose your character and follow the live ranking.",
    url: "/mascot-arena", type: "website",
    images: [{ url: "/mascots/bitcoin-viking-king-v2.webp", width: 1024, height: 1536, alt: "Bitcoin Viking King holding a golden shield" }],
  },
  twitter: { card: "summary_large_image", title: "AION Crypto Mascot Arena", description: "Vote for your champion in the weekly Battle for the Crown.", images: ["/mascots/bitcoin-viking-king-v2.webp"] },
};

const collectionJsonLd = {
  "@context": "https://schema.org", "@type": "ItemList",
  name: "AION Crypto Mascot Arena — Battle for the Crown", numberOfItems: MASCOTS.length,
  itemListElement: MASCOTS.map((character, index) => ({ "@type": "ListItem", position: index + 1, name: `${character.coin} — ${character.title}`, url: `/mascot-arena#${character.symbol.toLowerCase()}` })),
};

export default function MascotArenaPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
    <MascotArenaClient />
  </>;
}
