import type { MetadataRoute } from "next";
import { allPizzas } from "@/data/pizzas";

const siteUrl = "https://pizzariadonluydd.valdeilsonlima.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...allPizzas.map((pizza) => ({
      url: `${siteUrl}/pizza/${pizza.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
