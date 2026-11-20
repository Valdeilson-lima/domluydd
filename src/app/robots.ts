import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/store-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cardapio", "/pizza/"],
        disallow: ["/admin", "/pedido/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
