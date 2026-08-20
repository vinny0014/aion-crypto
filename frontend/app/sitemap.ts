import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site";
import { getPublishedArticles } from "../lib/api";
import { EXPLAINED_GUIDES } from "../lib/editorial-content";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "", "/markets", "/coins", "/mascot-arena", "/analysis", "/research", "/guides", "/learn", "/explained", "/glossary",
    "/about", "/contact", "/privacy", "/terms", "/disclaimer", "/risk-disclosure",
    "/editorial-policy", "/corrections-policy", "/newsletter", "/status", "/categories", "/tags",
    "/cookie-policy", "/sources-methodology", "/copyright-dmca", "/publisher", "/author/aion-crypto", "/accessibility",
  ];
  const coins = [
    "BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK",
    "AVAX", "DOT", "SHIB", "PEPE", "HYPE", "TRX", "SUI",
  ];
  const articles = await getPublishedArticles();
  return [
    ...staticPaths.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "daily" as const })),
    ...coins.map((s) => ({ url: `${SITE_URL}/crypto/${s}`, changeFrequency: "hourly" as const })),
    ...EXPLAINED_GUIDES.map(({ slug }) => ({ url: `${SITE_URL}/explained/${slug}`, changeFrequency: "monthly" as const })),
    ...(articles.length ? [{ url: `${SITE_URL}/news`, changeFrequency: "hourly" as const }] : []),
    ...articles.map((article) => ({ url: `${SITE_URL}/news/${article.slug}`, lastModified: new Date(article.updated_at), changeFrequency: "daily" as const })),
  ];
}
