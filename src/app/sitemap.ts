import type { MetadataRoute } from "next";
import { getFullCatalog } from "@/lib/catalog-store";
import { SITE_URL } from "@/lib/store-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getFullCatalog();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/cardapio`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const pizzaRoutes: MetadataRoute.Sitemap = catalog.pizzas
    .filter((p) => p.available !== false)
    .map((pizza) => ({
      url: `${SITE_URL}/pizza/${pizza.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...pizzaRoutes];
}
