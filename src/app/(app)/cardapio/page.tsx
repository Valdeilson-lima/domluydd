import type { Metadata } from "next";
import { MenuCatalog } from "@/features/menu/components/MenuCatalog";
import { STORE_NAME } from "@/lib/store-config";

export const metadata: Metadata = {
  title: "Cardápio e Pedido Online",
  description: `Peça pizzas salgadas, doces, meio a meio, combos e bebidas geladas na ${STORE_NAME}. Entrega em 12 bairros de João Pessoa ou retirada no balcão.`,
  alternates: {
    canonical: "/cardapio",
  },
};

export default function CardapioPage() {
  return <MenuCatalog />;
}
