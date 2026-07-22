export const dynamic = "force-static";

export function GET() {
  // Intentionally empty until the editorial pipeline attaches validated,
  // licensed images. Empty XML is safer than claiming image-less entries.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
