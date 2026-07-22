import { FIXTURE_ARTICLES } from "@/lib/fixtures";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  // Articles ship without fabricated stock photos; each entry lists the page and
  // any real image attached to it (none yet — pipeline attaches licensed images later).
  const items = FIXTURE_ARTICLES.map(
    (a) => `  <url>
    <loc>${SITE_URL}/news/${a.slug}</loc>
  </url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
