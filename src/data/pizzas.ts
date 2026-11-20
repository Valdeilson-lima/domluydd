import type { Pizza, CrustOption, ExtraIngredient } from "@/types";

export const PIZZA_IMAGES = [
  "/Pizza 2 Queijos.png",
  "/assets/img/photo-f159446387-960.jpg",
  "/assets/img/photo-f192755848-960.jpg",
  "/assets/img/photo-f29093071-960.jpg",
  "/assets/img/photo-f41882039-960.jpg",
  "/assets/img/photo-f100303227-960.jpg",
  "/assets/img/photo-f154799608-960.jpg",
  "/assets/img/photo-f106092414-960.jpg",
  "/assets/img/photo-f87508732-500.jpg",
  "/assets/img/photo-f79703781-500.jpg",
];

interface RawPizza {
  name: string;
  desc: string;
  p: number;
  m: number;
  g: number;
  tags: string[];
  highlight?: boolean;
  available?: boolean;
}

const rawSalgadas: RawPizza[] = [
  {
    name: "2 Queijos",
    desc: "Molho de tomate, mussarela, catupiry, tomate, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Queijos", "Tradicionais"],
  },
  {
    name: "3 Queijos",
    desc: "Molho de tomate, mussarela, catupiry, parmesão, tomate, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Queijos", "Tradicionais"],
  },
  {
    name: "4 Queijos",
    desc: "Molho de tomate, mussarela, catupiry, parmesão, provolone, tomate, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Queijos", "Especiais"],
    highlight: true,
  },
  {
    name: "5 Queijos",
    desc: "Molho de tomate, mussarela, catupiry, parmesão, provolone, gorgonzola, tomate, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Queijos", "Especiais"],
  },
  {
    name: "Calabresa",
    desc: "Molho de tomate fresco, mussarela, calabresa, cebola, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Tradicionais", "Mais Pedidas"],
    highlight: true,
  },
  {
    name: "Calabresa II",
    desc: "Molho de tomate fresco, mussarela, calabresa, cebola, catupiry, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Tradicionais"],
  },
  {
    name: "Catupiry",
    desc: "Molho de tomate fresco, mussarela, catupiry, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Queijos", "Tradicionais"],
  },
  {
    name: "Crocante",
    desc: "Molho de tomate fresco, mussarela, catupiry, orégano, batata palha e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Tradicionais"],
  },
  {
    name: "Frango",
    desc: "Molho de tomate fresco, frango, mussarela, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Frango", "Tradicionais"],
  },
  {
    name: "Frango Catupiry",
    desc: "Molho de tomate fresco, frango, catupiry, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Frango", "Mais Pedidas"],
    highlight: true,
  },
  {
    name: "Frango II",
    desc: "Molho de tomate fresco, frango, calabresa, mussarela, catupiry, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Frango", "Especiais"],
  },
  {
    name: "Moda da Casa",
    desc: "Molho de tomate fresco, presunto, mussarela, calabresa, catupiry, ovo, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Tradicionais", "Mais Pedidas"],
  },
  {
    name: "Marguerita",
    desc: "Molho de tomate fresco, mussarela, manjericão, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Tradicionais", "Queijos"],
    highlight: true,
  },
  {
    name: "Mista",
    desc: "Molho de tomate fresco, presunto, mussarela, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Tradicionais"],
  },
  {
    name: "Mussarela",
    desc: "Molho de tomate fresco, mussarela, tomate, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Queijos", "Tradicionais"],
  },
  {
    name: "Portuguesa",
    desc: "Molho de tomate fresco, presunto, mussarela, ovo, cebola, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Tradicionais", "Mais Pedidas"],
    highlight: true,
  },
  {
    name: "Toscana",
    desc: "Molho de tomate fresco, calabresa, ovo, cebola, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
    tags: ["Tradicionais"],
  },
  {
    name: "Paulista",
    desc: "Molho de tomate fresco, frango, mussarela, bacon, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Frango", "Especiais"],
  },
  {
    name: "Bacon",
    desc: "Molho de tomate, mussarela e bacon.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais"],
  },
  {
    name: "Bacon II",
    desc: "Molho de tomate, mussarela, bacon e catupiry.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais"],
  },
  {
    name: "Carne de Sol",
    desc: "Molho de tomate fresco, mussarela, carne de sol desfiada, cebola, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais", "Regionais", "Mais Pedidas"],
    highlight: true,
  },
  {
    name: "Carne de Sol II",
    desc: "Molho de tomate fresco, mussarela, carne de sol desfiada, catupiry, cebola, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais", "Regionais"],
  },
  {
    name: "Deliciosa",
    desc: "Molho de tomate fresco, frango, bacon, milho, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Frango", "Especiais"],
  },
  {
    name: "Napolitana",
    desc: "Molho de tomate fresco, presunto, mussarela, calabresa, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais"],
  },
  {
    name: "Jardineira",
    desc: "Molho de tomate fresco, frango, mussarela, palmito, cebola, catupiry, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Frango", "Especiais"],
  },
  {
    name: "Palmito",
    desc: "Molho de tomate fresco, mussarela, palmito, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais"],
  },
  {
    name: "Palmito II",
    desc: "Molho de tomate fresco, mussarela, presunto picado, palmito, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais"],
  },
  {
    name: "Siciliana",
    desc: "Molho de tomate fresco, mussarela, palmito, bacon, ervilha, milho, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais"],
  },
  {
    name: "Atum",
    desc: "Molho de tomate fresco, atum, cebola, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais", "Atum"],
  },
  {
    name: "Atum II",
    desc: "Molho de tomate fresco, mussarela, atum, cebola, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais", "Atum"],
  },
  {
    name: "Atum III",
    desc: "Molho de tomate fresco, atum, cebola, catupiry, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais", "Atum"],
  },
  {
    name: "Baianinha",
    desc: "Molho de tomate fresco, calabresa moída, mussarela, ovos, pimenta, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
    tags: ["Especiais"],
  },
];

const rawDoces: RawPizza[] = [
  {
    name: "Choconita",
    desc: "Base de catupiry, mussarela, banana e cobertura de chocolate.",
    p: 25,
    m: 30,
    g: 35,
    tags: ["Doces"],
  },
  {
    name: "Chocolate",
    desc: "Mussarela, base de catupiry, chocolate e leite condensado.",
    p: 25,
    m: 30,
    g: 35,
    tags: ["Doces", "Mais Pedidas"],
    highlight: true,
  },
  {
    name: "Bananita",
    desc: "Mussarela, banana, açúcar e canela.",
    p: 25,
    m: 30,
    g: 35,
    tags: ["Doces"],
  },
  {
    name: "Brigadeiro",
    desc: "Mussarela, chocolate derretido, leite condensado e granulado.",
    p: 25,
    m: 30,
    g: 35,
    tags: ["Doces", "Mais Pedidas"],
  },
  {
    name: "Prestígio",
    desc: "Mussarela, chocolate derretido, leite condensado e coco ralado.",
    p: 25,
    m: 30,
    g: 35,
    tags: ["Doces"],
  },
  {
    name: "Romeu & Julieta",
    desc: "Mussarela, base de catupiry, goiabada e leite condensado.",
    p: 25,
    m: 30,
    g: 35,
    tags: ["Doces"],
    highlight: true,
  },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const CRUST_OPTIONS: CrustOption[] = [
  {
    id: "sem-borda",
    name: "Borda Tradicional (Sem recheio)",
    price: 0,
    compatibleWith: ["salgada", "doce"],
  },
  {
    id: "catupiry",
    name: "Borda de Catupiry Original",
    price: 8,
    compatibleWith: ["salgada"],
  },
  {
    id: "cheddar",
    name: "Borda de Cheddar Cremoso",
    price: 8,
    compatibleWith: ["salgada"],
  },
  {
    id: "chocolate",
    name: "Borda de Chocolate ao Leite",
    price: 10,
    compatibleWith: ["doce"],
  },
  {
    id: "vulcao",
    name: "Borda Vulcão de Catupiry",
    price: 12,
    compatibleWith: ["salgada"],
  },
];

export const EXTRA_INGREDIENTS: ExtraIngredient[] = [
  {
    id: "extra-bacon",
    name: "Bacon Crocante Extra",
    price: 5,
    compatibleWith: ["salgada"],
  },
  {
    id: "extra-mussarela",
    name: "Queijo Mussarela Extra",
    price: 6,
    compatibleWith: ["salgada"],
  },
  {
    id: "extra-catupiry",
    name: "Catupiry Original Extra",
    price: 5,
    compatibleWith: ["salgada"],
  },
  {
    id: "extra-palmito",
    name: "Palmito Especial Extra",
    price: 6,
    compatibleWith: ["salgada"],
  },
  {
    id: "extra-azeitonas",
    name: "Azeitonas Extras",
    price: 3,
    compatibleWith: ["salgada"],
  },
  {
    id: "extra-chocolate",
    name: "Cobertura Extra de Chocolate",
    price: 6,
    compatibleWith: ["doce"],
  },
  {
    id: "extra-leite-condensado",
    name: "Leite Condensado Extra",
    price: 4,
    compatibleWith: ["doce"],
  },
];

export const COMMON_REMOVALS: string[] = [
  "Sem Cebola",
  "Sem Azeitona",
  "Sem Tomate",
  "Sem Orégano",
];

export const SWEET_REMOVALS: string[] = [
  "Sem Leite Condensado",
  "Sem Canela",
  "Sem Granulado",
];

function addIds(arr: RawPizza[], cat: "salgada" | "doce"): Pizza[] {
  return arr.map((item, i) => ({
    ...item,
    id: `${cat}-${i}`,
    slug: slugify(item.name),
    category: cat,
    imgIdx:
      cat === "salgada" && i === 0
        ? 0
        : 1 + ((cat === "doce" ? i + 5 : i) % (PIZZA_IMAGES.length - 1)),
    available: item.available ?? true,
  }));
}

export const MODAL_IMAGES = PIZZA_IMAGES;

export const salgadas = addIds(rawSalgadas, "salgada");
export const doces = addIds(rawDoces, "doce");
export const allPizzas = [...salgadas, ...doces];

export function getPizzaByName(name: string): Pizza | undefined {
  return allPizzas.find((p) => p.name === name);
}

export function getPizzaBySlug(slug: string): Pizza | undefined {
  return allPizzas.find((p) => p.slug === slug);
}
