import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  allPizzas,
  getPizzaBySlug,
  PIZZA_IMAGES,
  CRUST_OPTIONS,
} from "@/data/pizzas";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  Flame,
  Sparkles,
  ShoppingBag,
  Clock,
  Bike,
} from "lucide-react";

interface PizzaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allPizzas.map((pizza) => ({
    slug: pizza.slug,
  }));
}

export async function generateMetadata({
  params,
}: PizzaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const pizza = getPizzaBySlug(slug);
  if (!pizza) return { title: "Pizza não encontrada — Don Luydd" };

  return {
    title: `${pizza.name} — Don Luydd Pizzaria`,
    description: `${pizza.name}: ${pizza.desc}. A partir de R$ ${formatPrice(pizza.p)}. Peça pelo WhatsApp com entrega rápida!`,
    openGraph: {
      title: `${pizza.name} — Don Luydd Pizzaria`,
      description: `${pizza.name}: ${pizza.desc}. Peça pelo WhatsApp!`,
      images: [
        {
          url: PIZZA_IMAGES[pizza.imgIdx],
          width: 800,
          height: 600,
          alt: pizza.name,
        },
      ],
    },
  };
}

export default async function PizzaPage({ params }: PizzaPageProps) {
  const { slug } = await params;
  const pizza = getPizzaBySlug(slug);

  if (!pizza) {
    notFound();
  }

  const isAvailable = pizza.available !== false;
  const imgSrc = PIZZA_IMAGES[pizza.imgIdx];
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pizza.name,
    description: pizza.desc,
    image: `https://donluydd.com.br${imgSrc}`,
    brand: { "@type": "Brand", name: "Don Luydd Pizzaria" },
    category: pizza.category === "doce" ? "Pizza doce" : "Pizza salgada",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: pizza.p,
      highPrice: pizza.g,
      offerCount: 3,
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `https://donluydd.com.br/pizza/${pizza.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-yellow/20 bg-[#1a1415]/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-yellow transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span>Voltar ao cardápio completo</span>
          </Link>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Don Luydd Pizzaria
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Pizza Image Card */}
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm border border-white/10 shadow-2xl bg-black">
            <Image
              src={imgSrc}
              alt={pizza.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="rounded-sm bg-black/80 px-3 py-1 font-mono text-xs font-bold text-yellow border border-yellow/30 backdrop-blur-md">
                {pizza.category === "doce"
                  ? "Pizza Doce"
                  : "Pizza Artesanal Salgada"}
              </span>
            </div>

            {!isAvailable && (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                <span className="rounded-sm border border-red-500/50 bg-red-950/80 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-red-300 shadow-xl">
                  Esgotado Hoje
                </span>
              </div>
            )}
          </div>

          {/* Pizza Info & Actions */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-yellow mb-1 font-mono text-xs font-bold uppercase tracking-widest">
                <Flame className="size-3.5 fill-yellow" />
                Massa Fermentação Natural 48h
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold italic tracking-tight text-cream">
                {pizza.name}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-cream-dim leading-relaxed">
                {pizza.desc}
              </p>
            </div>

            {/* Size Options & Prices */}
            <div className="space-y-3 rounded-sm border border-white/8 bg-white/2 p-4 sm:p-5">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted">
                Tamanhos e Valores
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-sm border border-white/8 bg-black/40 p-3 text-center">
                  <span className="block font-mono text-[0.65rem] text-muted uppercase">
                    P · 4 Fatias
                  </span>
                  <span className="block font-display text-lg font-bold text-yellow mt-1">
                    R$ {formatPrice(pizza.p)}
                  </span>
                  <span className="block text-[0.62rem] text-cream-dim mt-0.5">
                    Individual
                  </span>
                </div>

                <div className="rounded-sm border border-yellow/40 bg-yellow/10 p-3 text-center ring-1 ring-yellow/30">
                  <span className="block font-mono text-[0.65rem] text-yellow font-bold uppercase">
                    M · 6 Fatias ⭐
                  </span>
                  <span className="block font-display text-lg font-bold text-yellow mt-1">
                    R$ {formatPrice(pizza.m)}
                  </span>
                  <span className="block text-[0.62rem] text-cream mt-0.5 font-medium">
                    2 a 3 pessoas
                  </span>
                </div>

                <div className="rounded-sm border border-white/8 bg-black/40 p-3 text-center">
                  <span className="block font-mono text-[0.65rem] text-muted uppercase">
                    G · 8 Fatias
                  </span>
                  <span className="block font-display text-lg font-bold text-yellow mt-1">
                    R$ {formatPrice(pizza.g)}
                  </span>
                  <span className="block text-[0.62rem] text-cream-dim mt-0.5">
                    3 a 4 pessoas
                  </span>
                </div>
              </div>
            </div>

            {/* Bordas Recheadas Disponíveis */}
            <div className="space-y-2 rounded-sm border border-white/8 bg-white/2 p-4">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-cream">
                <Sparkles className="size-3.5 text-yellow" />
                Opções de Bordas Recheadas
              </span>
              <ul className="text-xs text-muted space-y-1">
                {CRUST_OPTIONS.filter((c) => c.price > 0).map((c) => (
                  <li key={c.id} className="flex justify-between items-center">
                    <span>{c.name}</span>
                    <span className="font-mono text-yellow font-medium">
                      + R$ {formatPrice(c.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Delivery Info */}
            <div className="flex flex-wrap gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-yellow" />
                Terça a Domingo: 18h às 22h
              </span>
              <span className="flex items-center gap-1.5">
                <Bike className="size-4 text-yellow" />
                Entrega rápida ou retirada no balcão
              </span>
            </div>

            {/* Call to Action */}
            <div className="pt-2">
              <Link
                href={`/?pizza=${pizza.slug}`}
                className={`flex w-full items-center justify-center gap-2.5 rounded-sm bg-linear-to-r from-red-dark via-red-primary to-yellow px-6 py-4 font-body text-base font-bold text-cream shadow-xl transition-all duration-200 hover:brightness-110 active:scale-98 ${
                  !isAvailable ? "pointer-events-none opacity-40" : ""
                }`}
              >
                <ShoppingBag className="size-5" />
                <span>
                  {isAvailable
                    ? "Personalizar e Pedir esta Pizza"
                    : "Sabor Esgotado Hoje"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
