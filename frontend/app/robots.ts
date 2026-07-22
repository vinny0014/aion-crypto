import type { MetadataRoute } from "next";
import { INDEXING_ENABLED, SITE_URL } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!INDEXING_ENABLED) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      host: SITE_URL,
    };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/login"] }],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/news-sitemap.xml`,
      `${SITE_URL}/image-sitemap.xml`,
    ],
    host: SITE_URL,
  };
}
