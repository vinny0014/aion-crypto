import { SITE_URL, APP_NAME, TAGLINE } from "../../lib/site";

export const dynamic = "force-static";

export function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${APP_NAME}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>${TAGLINE} — crypto market news and analysis.</description>
    <language>en</language>
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
