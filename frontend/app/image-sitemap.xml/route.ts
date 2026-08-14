import { MASCOTS } from "../../lib/mascots";
import { SITE_URL } from "../../lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function GET() {
  const images = MASCOTS.map((mascot) => `
    <image:image>
      <image:loc>${SITE_URL}${mascot.image}</image:loc>
      <image:title>${escapeXml(`${mascot.coin} — ${mascot.title}`)}</image:title>
      <image:caption>${escapeXml(mascot.lore)}</image:caption>
    </image:image>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/mascot-arena</loc>${images}
  </url>
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
