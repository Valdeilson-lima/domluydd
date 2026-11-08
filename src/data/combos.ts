import type { Combo } from "@/types";

export const combos: Combo[] = [
  {
    id: "combo-casal",
    name: "Combo Casal Perfeito",
    desc: "1 Pizza Média (6 fatias, até 2 sabores) + 1 Guaraná Antarctica 1L gelado.",
    price: 43.9,
    originalPrice: 48.0,
    items: ["1 Pizza Média (6 fatias)", "1 Guaraná Antarctica 1L"],
    available: true,
  },
  {
    id: "combo-familia",
    name: "Combo Família Don Luydd",
    desc: "1 Pizza Grande (8 fatias, até 2 sabores) + 1 Coca-Cola 2L trincando.",
    price: 54.9,
    originalPrice: 60.0,
    items: ["1 Pizza Grande (8 fatias)", "1 Coca-Cola 2L"],
    available: true,
  },
  {
    id: "combo-completo",
    name: "Combo Festa Completa",
    desc: "1 Pizza Grande Salgada + 1 Pizza Pequena Doce (Sobremesa) + 1 Coca-Cola 2L.",
    price: 76.9,
    originalPrice: 85.0,
    items: ["1 Pizza Grande Salgada", "1 Pizza Pequena Doce", "1 Coca-Cola 2L"],
    available: true,
  },
  {
    id: "combo-galera",
    name: "Combo Mega Galera",
    desc: "2 Pizzas Grandes Salgadas (16 fatias no total) + 2 Refrigerantes 2L à sua escolha.",
    price: 109.9,
    originalPrice: 120.0,
    items: ["2 Pizzas Grandes (16 fatias)", "2 Refrigerantes 2L"],
    available: true,
  },
];
