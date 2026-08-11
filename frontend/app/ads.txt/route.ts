const publisherId = process.env.ADSENSE_PUBLISHER_ID?.trim() ?? "";

export function GET() {
  if (!/^pub-\d{16}$/.test(publisherId)) {
    return new Response("", {
      status: 404,
      headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Cache-Control": "public, max-age=3600", "Content-Type": "text/plain; charset=utf-8" },
  });
}
