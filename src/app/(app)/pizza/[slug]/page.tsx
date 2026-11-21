import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PizzaDetailClient } from "@/features/menu/components/PizzaDetailClient";
import { getFullCatalog } from "@/lib/catalog-store";
import { getEffectiveStoreStatus } from "@/lib/server-store";
import { SITE_URL, STORE_NAME } from "@/lib/store-config";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getFullCatalog();
  const pizza = catalog.pizzas.find((p) => p.slug === slug);
  if (!pizza) {
    return { title: "Sabor não encontrado" };
  }

  return {
    title: `Pizza ${pizza.name}`,
    description: `${pizza.desc} Tamanhos P (R$ ${pizza.p}), M (R$ ${pizza.m}) e G (R$ ${pizza.g}) na ${STORE_NAME}.`,
    alternates: {
      canonical: `${SITE_URL}/pizza/${pizza.slug}`,
    },
  };
}

export default async function PizzaSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [catalog, storeStatus] = await Promise.all([
    getFullCatalog(),
    getEffectiveStoreStatus(),
  ]);
  const pizza = catalog.pizzas.find((p) => p.slug === slug);
  if (!pizza) {
    notFound();
  }

  return (
    <PizzaDetailClient
      pizza={pizza}
      initialCatalog={catalog}
      initialStoreStatus={storeStatus}
    />
  );
}
