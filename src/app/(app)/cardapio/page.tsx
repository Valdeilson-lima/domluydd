import type { Metadata } from "next";
import { MenuCatalog } from "@/features/menu/components/MenuCatalog";
import { getFullCatalog } from "@/lib/catalog-store";
import { getEffectiveStoreStatus } from "@/lib/server-store";
import { STORE_NAME } from "@/lib/store-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cardápio e Pedido Online",
  description: `Peça pizzas salgadas, doces, meio a meio, combos e bebidas geladas na ${STORE_NAME}. Entrega em João Pessoa ou retirada no balcão.`,
  alternates: {
    canonical: "/cardapio",
  },
};

export default async function CardapioPage() {
  const [catalog, storeStatus] = await Promise.all([
    getFullCatalog(),
    getEffectiveStoreStatus(),
  ]);
  return (
    <MenuCatalog initialCatalog={catalog} initialStoreStatus={storeStatus} />
  );
}
