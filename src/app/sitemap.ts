import type { MetadataRoute } from "next";
import { allPizzas } from "@/data/pizzas";
import { SITE_URL } from "@/lib/store-config";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const pizzaRoutes: MetadataRoute.Sitemap = allPizzas.map((pizza) => ({
    url: `${SITE_URL}/pizza/${pizza.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...pizzaRoutes];
}
