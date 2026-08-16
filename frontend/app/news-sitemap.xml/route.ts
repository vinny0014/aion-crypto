import { getPublishedArticles } from "../../lib/api";
import { SITE_URL } from "../../lib/site";

export const dynamic = "force-dynamic";
const esc = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export async function GET() {
  const articles = (await getPublishedArticles()).filter((article) => Date.now() - new Date(article.published_at).getTime() <= 48 * 60 * 60 * 1000);
  const entries = articles.map((article) => `<url><loc>${SITE_URL}/news/${esc(article.slug)}</loc><news:news><news:publication><news:name>AION Crypto</news:name><news:language>en</news:language></news:publication><news:publication_date>${esc(article.published_at)}</news:publication_date><news:title>${esc(article.title)}</news:title></news:news></url>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
