import { APP_NAME, INDEXING_ENABLED } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      app: APP_NAME,
      indexing: INDEXING_ENABLED ? "enabled" : "disabled",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
