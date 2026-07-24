import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";

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
  ];
}
