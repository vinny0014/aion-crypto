import { getPublishedArticles } from "../../lib/api";
import { SITE_URL, APP_NAME, TAGLINE } from "../../lib/site";

export const dynamic = "force-dynamic";
const esc = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export async function GET() {
  const items = (await getPublishedArticles()).slice(0, 50).map((article) => `<item><title>${esc(article.title)}</title><link>${SITE_URL}/news/${esc(article.slug)}</link><guid isPermaLink="true">${SITE_URL}/news/${esc(article.slug)}</guid><pubDate>${new Date(article.published_at).toUTCString()}</pubDate><description>${esc(article.summary)}</description></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${APP_NAME}</title><link>${SITE_URL}</link><atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/><description>${TAGLINE} — crypto market news and analysis.</description><language>en</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
