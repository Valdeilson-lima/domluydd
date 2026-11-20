import { getEffectiveStoreStatus } from "@/lib/server-store";
import { renderStorefrontHtml } from "@/lib/storefront-html";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getEffectiveStoreStatus();
  const html = renderStorefrontHtml(status);

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
