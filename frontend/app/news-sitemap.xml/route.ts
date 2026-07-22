import { FIXTURE_ARTICLES } from "@/lib/fixtures";
import { SITE_URL, APP_NAME } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const dateOf = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600_000).toISOString();

const items = FIXTURE_ARTICLES.map(
    (a) => `  <url>
    <loc>${SITE_URL}/news/${a.slug}</loc>
    <news:news>
      <news:publication><news:name>${APP_NAME}</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${dateOf(a.hoursAgo)}</news:publication_date>
      <news:title>${a.title.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</news:title>
    </news:news>
  </url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
