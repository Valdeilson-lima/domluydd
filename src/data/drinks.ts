import type { Drink } from "@/types";

export const bebidas: Drink[] = [
  {
    id: "coca-cola",
    name: "Coca-Cola",
    icon: "coca",
    price: 8,
    desc: "Refrigerante de cola gelado (350ml)",
    tags: ["Clássicos", "Gelados"],
    available: true,
  },
  {
    id: "guarana",
    name: "Guaraná",
    icon: "guarana",
    price: 8,
    desc: "Refrigerante de guaraná gelado (350ml)",
    tags: ["Clássicos", "Gelados"],
    available: true,
  },
  {
    id: "fanta",
    name: "Fanta",
    icon: "fanta",
    price: 8,
    desc: "Refrigerante sabor laranja gelado (350ml)",
    tags: ["Cítricos", "Gelados"],
    available: true,
  },
  {
    id: "cajuina",
    name: "Cajuína",
    icon: "cajuina",
    price: 8,
    desc: "Bebida regional de caju gelada",
    tags: ["Regionais", "Gelados"],
    available: true,
  },
];
