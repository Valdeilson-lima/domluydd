import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPizzas, getPizzaBySlug } from "@/data/pizzas";
import { PizzaDetailClient } from "@/features/menu/components/PizzaDetailClient";
import { SITE_URL, STORE_NAME } from "@/lib/store-config";

export function generateStaticParams() {
  return allPizzas.map((pizza) => ({ slug: pizza.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pizza = getPizzaBySlug(slug);
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
  const pizza = getPizzaBySlug(slug);
  if (!pizza) {
    notFound();
  }

  return <PizzaDetailClient pizza={pizza} />;
}
