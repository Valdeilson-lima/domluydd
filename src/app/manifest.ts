import type { MetadataRoute } from "next";
import { STORE_NAME, STORE_SHORT_NAME } from "@/lib/store-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: STORE_NAME,
    short_name: STORE_SHORT_NAME,
    description:
      "Peça pizzas salgadas, doces, meio a meio, combos e bebidas geladas na Don Luydd Pizzaria no Centro de João Pessoa.",
    start_url: "/cardapio?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f5ef",
    theme_color: "#f8f5ef",
    lang: "pt-BR",
    categories: ["food", "shopping"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Abrir cardápio",
        short_name: "Cardápio",
        description: "Ver todos os 38 sabores, combos e bebidas",
        url: "/cardapio",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Pizzas salgadas",
        short_name: "Salgadas",
        description: "Escolher pizzas salgadas ou meio a meio",
        url: "/cardapio?cat=salgada",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
