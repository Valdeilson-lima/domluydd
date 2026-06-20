import type { Pizza } from "@/types";

const PIZZA_IMAGES = [
  "https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_960_720.jpg",
  "https://cdn.pixabay.com/photo/2020/06/08/16/49/pizza-5275191_960_720.jpg",
  "https://cdn.pixabay.com/photo/2016/04/21/22/50/pizza-1344720_960_720.jpg",
  "https://cdn.pixabay.com/photo/2014/04/22/02/56/pizza-329523_960_720.jpg",
  "https://cdn.pixabay.com/photo/2014/07/08/12/34/pizza-386717_960_720.jpg",
  "https://img.freepik.com/free-photo/pizza-pizza-filled-with-tomatoes-salami-olives_140725-1200.jpg",
  "https://img.freepik.com/free-photo/delicious-pizza-with-vegetables_144627-22184.jpg",
  "https://img.freepik.com/free-photo/top-view-pepperoni-pizza-with-mushrooms-sliced_141793-2144.jpg",
];

interface RawPizza {
  name: string;
  desc: string;
  p: number;
  m: number;
  g: number;
}

const rawSalgadas: RawPizza[] = [
  {
    name: "2 Queijos",
    desc: "Molho de tomate, mussarela, catupiry, tomate, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "3 Queijos",
    desc: "Molho de tomate, mussarela, catupiry, parmesão, tomate, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "4 Queijos",
    desc: "Molho de tomate, mussarela, catupiry, parmesão, provolone, tomate, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "5 Queijos",
    desc: "Molho de tomate, mussarela, catupiry, parmesão, provolone, gorgonzola, tomate, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Calabresa",
    desc: "Molho de tomate fresco, mussarela, calabresa, cebola, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Calabresa II",
    desc: "Molho de tomate fresco, mussarela, calabresa, cebola, catupiry, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Catupiry",
    desc: "Molho de tomate fresco, mussarela, catupiry, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Crocante",
    desc: "Molho de tomate fresco, mussarela, catupiry, orégano, batata palha e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Frango",
    desc: "Molho de tomate fresco, frango, mussarela, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Frango Catupiry",
    desc: "Molho de tomate fresco, frango, catupiry, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Frango II",
    desc: "Molho de tomate fresco, frango, calabresa, mussarela, catupiry, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Moda da Casa",
    desc: "Molho de tomate fresco, presunto, mussarela, calabresa, catupiry, ovo, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Marguerita",
    desc: "Molho de tomate fresco, mussarela, manjericão, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Mista",
    desc: "Molho de tomate fresco, presunto, mussarela, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Mussarela",
    desc: "Molho de tomate fresco, mussarela, tomate, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Portuguesa",
    desc: "Molho de tomate fresco, presunto, mussarela, ovo, cebola, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Toscana",
    desc: "Molho de tomate fresco, calabresa, ovo, cebola, orégano e azeitona.",
    p: 30,
    m: 35,
    g: 40,
  },
  {
    name: "Paulista",
    desc: "Molho de tomate fresco, frango, mussarela, bacon, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Bacon",
    desc: "Molho de tomate, mussarela e bacon.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Bacon II",
    desc: "Molho de tomate, mussarela, bacon e catupiry.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Carne de Sol",
    desc: "Molho de tomate fresco, mussarela, carne de sol desfiada, cebola, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Carne de Sol II",
    desc: "Molho de tomate fresco, mussarela, carne de sol desfiada, catupiry, cebola, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Deliciosa",
    desc: "Molho de tomate fresco, frango, bacon, milho, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Napolitana",
    desc: "Molho de tomate fresco, presunto, mussarela, calabresa, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Jardineira",
    desc: "Molho de tomate fresco, frango, mussarela, palmito, cebola, catupiry, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Palmito",
    desc: "Molho de tomate fresco, mussarela, palmito, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Palmito II",
    desc: "Molho de tomate fresco, mussarela, presunto picado, palmito, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Siciliana",
    desc: "Molho de tomate fresco, mussarela, palmito, bacon, ervilha, milho, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Atum",
    desc: "Molho de tomate fresco, atum, cebola, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Atum II",
    desc: "Molho de tomate fresco, mussarela, atum, cebola, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Atum III",
    desc: "Molho de tomate fresco, atum, cebola, catupiry, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
  {
    name: "Baianinha",
    desc: "Molho de tomate fresco, calabresa moída, mussarela, ovos, pimenta, orégano e azeitona.",
    p: 35,
    m: 40,
    g: 45,
  },
];

const rawDoces: RawPizza[] = [
  {
    name: "Choconita",
    desc: "Base de catupiry, mussarela, banana e cobertura de chocolate.",
    p: 25,
    m: 30,
    g: 35,
  },
  {
    name: "Chocolate",
    desc: "Mussarela, base de catupiry, chocolate e leite condensado.",
    p: 25,
    m: 30,
    g: 35,
  },
  {
    name: "Bananita",
    desc: "Mussarela, banana, açúcar e canela.",
    p: 25,
    m: 30,
    g: 35,
  },
  {
    name: "Brigadeiro",
    desc: "Mussarela, chocolate derretido, leite condensado e granulado.",
    p: 25,
    m: 30,
    g: 35,
  },
  {
    name: "Prestígio",
    desc: "Mussarela, chocolate derretido, leite condensado e coco ralado.",
    p: 25,
    m: 30,
    g: 35,
  },
  {
    name: "Romeu & Julieta",
    desc: "Mussarela, base de catupiry, goiabada e leite condensado.",
    p: 25,
    m: 30,
    g: 35,
  },
];

function addIds(arr: RawPizza[], cat: "salgada" | "doce"): Pizza[] {
  return arr.map((item, i) => ({
    ...item,
    id: `${cat}-${i}`,
    category: cat,
    imgIdx: i % PIZZA_IMAGES.length,
  }));
}

export const MODAL_IMAGES = PIZZA_IMAGES;

export const salgadas = addIds(rawSalgadas, "salgada");
export const doces = addIds(rawDoces, "doce");
export const allPizzas = [...salgadas, ...doces];

export function getPizzaByName(name: string): Pizza | undefined {
  return allPizzas.find((p) => p.name === name);
}
