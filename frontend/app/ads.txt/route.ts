// ads.txt is a public ownership declaration, not a secret. Keeping the
// confirmed publisher ID in source makes the declaration reliable across
// Hostinger build/runtime environment differences.
const publisherId = "pub-3354845222558845";

export function GET() {
  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Cache-Control": "public, max-age=3600", "Content-Type": "text/plain; charset=utf-8" },
  });
}
