import { FIXTURE_ARTICLES } from "@/lib/fixtures";
import { SITE_URL, APP_NAME, TAGLINE } from "@/lib/site";

export const dynamic = "force-static";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function GET() {
  const dateOf = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600_000);

const items = FIXTURE_ARTICLES.map(
    (a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${SITE_URL}/news/${a.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/news/${a.slug}</guid>
      <pubDate>${dateOf(a.hoursAgo).toUTCString()}</pubDate>
      <description>${esc(a.summary)}</description>
    </item>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${APP_NAME}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>${TAGLINE} — crypto market news and analysis.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
