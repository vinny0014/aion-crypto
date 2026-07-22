import type { MetadataRoute } from "next";
import { FIXTURE_ARTICLES } from "@/lib/fixtures";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "", "/markets", "/news", "/analysis", "/research", "/guides", "/learn", "/glossary",
    "/about", "/contact", "/privacy", "/terms", "/disclaimer", "/risk-disclosure",
    "/editorial-policy", "/corrections-policy", "/newsletter", "/status", "/categories", "/tags",
  ];
  const coins = ["BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "LINK"];
  return [
    ...staticPaths.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "hourly" as const })),
    ...coins.map((s) => ({ url: `${SITE_URL}/crypto/${s}`, changeFrequency: "hourly" as const })),
    ...FIXTURE_ARTICLES.map((a) => ({ url: `${SITE_URL}/news/${a.slug}`, changeFrequency: "daily" as const })),
  ];
}
