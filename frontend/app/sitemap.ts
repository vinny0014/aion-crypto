import type { MetadataRoute } from "next";
import { FIXTURE_ARTICLES } from "@/lib/fixtures";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "", "/markets", "/news", "/analysis", "/research", "/guides", "/learn", "/glossary",
    "/about", "/contact", "/privacy", "/terms", "/disclaimer", "/risk-disclosure",
    "/editorial-policy", "/corrections-policy", "/newsletter", "/status", "/categories", "/tags",
  ];
  const coins = ["BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "LINK"];
  return [
    ...staticPaths.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "hourly" as const })),
    ...coins.map((s) => ({ url: `${SITE}/crypto/${s}`, changeFrequency: "hourly" as const })),
    ...FIXTURE_ARTICLES.map((a) => ({ url: `${SITE}/news/${a.slug}`, changeFrequency: "daily" as const })),
  ];
}
