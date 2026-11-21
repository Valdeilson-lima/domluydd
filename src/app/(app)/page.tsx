import Link from "next/link";
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Flame,
  MapPin,
  Sparkles,
  Check,
  ShoppingBag,
  SplitSquareHorizontal,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import {
  HomeHeroItem,
  HomeHeroMedia,
  HomeHeroStagger,
  HomeMotionProvider,
  HomeNav,
  HomeScrollProgress,
  ScrollReveal,
  StaggerGrid,
  StaggerItem,
  type HomeNavItem,
} from "@/features/home/components/HomeMotion";
import { getFullCatalog } from "@/lib/catalog-store";
import { getPizzaImageSrc, MEDIA_URLS } from "@/lib/media";
import { getEffectiveStoreStatus } from "@/lib/server-store";
import { SITE_URL, STORE_MAP_URL } from "@/lib/store-config";
import {
  formatPrice,
  groupScheduleForDisplay,
  roundCurrency,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const FEATURED_SLUGS = ["calabresa", "4-queijos", "carne-de-sol", "chocolate"];

export default async function HomePage() {
  const [status, catalog] = await Promise.all([
    getEffectiveStoreStatus(),
    getFullCatalog(),
  ]);

  const { profile } = status;
  const activePizzas = catalog.pizzas.filter((p) => p.available !== false);
  const activeCombos = catalog.combos.filter((c) => c.available !== false);
  const activeBairros = catalog.bairros.filter((b) => b.active !== false);
  const salgadasCount = activePizzas.filter(
    (p) => p.category === "salgada"
  ).length;
  const docesCount = activePizzas.filter((p) => p.category === "doce").length;
  const minPrice =
    activePizzas.length > 0 ? Math.min(...activePizzas.map((p) => p.p)) : 25;
  const maxComboSavings = activeCombos.reduce(
    (acc, c) => Math.max(acc, roundCurrency(c.originalPrice - c.price)),
    0
  );

  const navItems: HomeNavItem[] = [
    { id: "sabores", label: "Sabores" },
    ...(activeCombos.length > 0 ? [{ id: "combos", label: "Combos" }] : []),
    { id: "forno", label: "Nosso forno" },
    { id: "visita", label: "Horário e entrega" },
  ];

  const scheduleRows = groupScheduleForDisplay(profile.schedule);
  const firstOpenRow = scheduleRows.find((r) => !r.isClosed);
  const processSteps = [
    {
      title: "Massa aberta na hora",
      desc: "Cada disco é aberto sob pedido nos tamanhos P (4), M (6) e G (8 fatias), com opção meio a meio na média e na grande.",
      image: MEDIA_URLS.fornoMassaBancada,
      alt: "Mãos de pizzaiolo abrindo massa fresca na bancada enfarinhada ao lado de molho de tomate",
    },
    {
      title: `${profile.ovenLabel} de pedra`,
      desc: "Calor uniforme por cima e por baixo na pedra garante fundo crocante e queijo borbulhando sem ressecar a cobertura.",
      image: MEDIA_URLS.fornoPedra960,
      alt: "Pizza assada por igual com borda firme e dourada servida sobre madeira",
    },
    {
      title: "Direto para a caixa térmica",
      desc: `Vai cortada e quentinha para entrega em ${activeBairros.length} bairros de ${profile.city} (${profile.estimatedDelivery}) ou retirada no balcão.`,
      image: MEDIA_URLS.caixaTermica960,
      alt: "Pizza fatiada acomodada na caixa térmica pronta para entrega",
    },
  ];

  const statusText = status.isOpen
    ? /^aberto/i.test(status.nextLabel)
      ? status.nextLabel
      : `Aberto agora · ${status.nextLabel}`
    : status.customMessage
      ? `Fechado · ${status.customMessage}`
      : /^fechado/i.test(status.nextLabel)
        ? status.nextLabel
        : `Fechado agora · ${status.nextLabel}`;

  const preferredFeatured = FEATURED_SLUGS.map((slug) =>
    activePizzas.find((p) => p.slug === slug)
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));

  const featuredPizzas =
    preferredFeatured.length >= 4
      ? preferredFeatured.slice(0, 4)
      : [
          ...preferredFeatured,
          ...activePizzas.filter(
            (p) =>
              p.highlight && !preferredFeatured.some((fp) => fp.id === p.id)
          ),
          ...activePizzas.filter(
            (p) => !preferredFeatured.some((fp) => fp.id === p.id)
          ),
        ].slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: profile.storeName,
    url: SITE_URL,
    servesCuisine: "Pizza",
    priceRange: `R$ ${minPrice} - R$ 110`,
    address: {
      "@type": "PostalAddress",
      streetAddress: profile.streetDistrict,
      addressLocality: profile.city,
      addressRegion: "PB",
      addressCountry: "BR",
    },
  };

  return (
    <HomeMotionProvider>
      <div className="min-h-dvh bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" className="group min-w-0">
              <BrandMark subtitle="Pizzaria Delivery" size="md" />
            </Link>

            <HomeNav items={navItems} />

            <div className="flex items-center gap-3">
              <span
                className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold lg:inline-flex ${
                  status.isOpen
                    ? "bg-status-open/10 text-status-open"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {status.isOpen ? (
                  <CheckCircle2
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {status.isOpen ? "Aberto agora" : status.hoursShort}
                </span>
              </span>

              <Link
                href="/cardapio"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98]"
              >
                <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
                <span>Ver cardápio</span>
              </Link>
            </div>
          </div>
          <HomeScrollProgress />
        </header>

        <main id="main-content">
          {/* HERO */}
          <section
            aria-labelledby="hero-heading"
            className="border-b border-border bg-linear-to-b from-secondary/65 via-background to-background"
          >
            <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:py-16">
              <HomeHeroStagger className="space-y-5 lg:col-span-6">
                <HomeHeroItem>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold shadow-xs">
                    <span
                      className={`size-2 rounded-full ${
                        status.isOpen ? "bg-status-open" : "bg-accent-gold"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-foreground">{statusText}</span>
                  </div>
                </HomeHeroItem>

                <HomeHeroItem>
                  <h1
                    id="hero-heading"
                    className="font-serif text-4xl font-extrabold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]"
                  >
                    Pizza quentinha do forno direto pra sua mesa.
                  </h1>
                </HomeHeroItem>

                <HomeHeroItem>
                  <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {activePizzas.length} sabores salgados e doces assados em{" "}
                    {profile.ovenLabel.toLowerCase()} de pedra, opção meio a
                    meio, bordas recheadas e entrega em {activeBairros.length}{" "}
                    bairros de {profile.city} a partir de{" "}
                    <strong className="font-bold text-foreground">
                      R$ {formatPrice(minPrice)}
                    </strong>
                    .
                  </p>
                </HomeHeroItem>

                <HomeHeroItem>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Link
                      href="/cardapio"
                      className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98]"
                    >
                      <span>Montar meu pedido</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                    {activeCombos.length > 0 && (
                      <Link
                        href="/cardapio?cat=combo"
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                      >
                        <Sparkles
                          className="size-4 text-accent-gold"
                          aria-hidden="true"
                        />
                        <span>Ver combos com refri</span>
                      </Link>
                    )}
                  </div>
                </HomeHeroItem>

                <HomeHeroItem>
                  <dl className="grid grid-cols-3 gap-3 border-t border-border pt-5 text-left">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Cardápio
                      </dt>
                      <dd className="mt-0.5 font-serif text-lg font-bold text-foreground">
                        {activePizzas.length} sabores
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Entrega média
                      </dt>
                      <dd className="mt-0.5 font-serif text-lg font-bold text-foreground">
                        {profile.estimatedDelivery}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Funcionamento
                      </dt>
                      <dd className="mt-0.5 font-serif text-lg font-bold text-foreground">
                        {firstOpenRow ? firstOpenRow.hours : status.hoursShort}
                      </dd>
                    </div>
                  </dl>
                </HomeHeroItem>
              </HomeHeroStagger>

              <HomeHeroMedia
                className="lg:col-span-6"
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-card px-5 py-3.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                      <Flame
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      {profile.ovenLabel} · P (4), M (6) e G (8 fatias)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-gold-soft px-2.5 py-1 font-bold text-accent-gold-ink">
                      <SplitSquareHorizontal
                        className="size-3.5"
                        aria-hidden="true"
                      />
                      Meio a meio liberado
                    </span>
                  </div>
                }
              >
                <picture className="block size-full">
                  <source
                    media="(max-width: 640px)"
                    srcSet={MEDIA_URLS.margherita960}
                  />
                  <img
                    src={MEDIA_URLS.heroMargherita1280}
                    alt="Pizza recém-assada com mussarela derretida, tomate e folhas frescas de manjericão"
                    width={1280}
                    height={960}
                    fetchPriority="high"
                    className="size-full object-cover"
                  />
                </picture>
              </HomeHeroMedia>
            </div>
          </section>

          {/* DESTAQUES DO FORNO */}
          <section
            id="sabores"
            aria-labelledby="sabores-heading"
            className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6 lg:py-16"
          >
            <ScrollReveal className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Mais pedidas da casa
                </p>
                <h2
                  id="sabores-heading"
                  className="font-serif text-3xl font-extrabold text-foreground sm:text-4xl"
                >
                  Favoritas de quem pede toda semana
                </h2>
                <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                  {salgadasCount} sabores salgados, {docesCount} pizzas doces
                  sobremesa e {catalog.crusts.length} opções de borda para
                  montar do seu jeito.
                </p>
              </div>
              <Link
                href="/cardapio"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-primary-hover"
              >
                <span>Explorar todos os {activePizzas.length} sabores</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </ScrollReveal>

            <StaggerGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredPizzas.map((pizza) => (
                <StaggerItem key={pizza.id} liftOnHover className="h-full">
                  <Link
                    href={`/pizza/${pizza.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[box-shadow,border-color] duration-200 hover:border-primary/35 hover:shadow-md"
                  >
                    <div className="aspect-4/3 w-full overflow-hidden bg-secondary">
                      <img
                        src={getPizzaImageSrc(pizza.imgIdx, pizza.image)}
                        alt={`Pizza sabor ${pizza.name}`}
                        width={640}
                        height={480}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-serif text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                            {pizza.name}
                          </h3>
                          <span className="shrink-0 rounded-full bg-accent-gold-soft px-2 py-0.5 text-[11px] font-bold text-accent-gold-ink">
                            {pizza.category === "doce" ? "Doce" : "Destaque"}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {pizza.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <div>
                          <span className="block text-[11px] text-muted-foreground">
                            A partir de
                          </span>
                          <span className="text-base font-extrabold text-foreground tabular-nums">
                            R$ {formatPrice(pizza.p)}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          Montar
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </section>

          {/* COMBOS DA CASA */}
          {activeCombos.length > 0 && (
            <section
              id="combos"
              aria-labelledby="combos-heading"
              className="border-y border-border bg-secondary/65 py-14 lg:py-16"
            >
              <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-12">
                <ScrollReveal className="lg:col-span-5">
                  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-foreground/5">
                    <img
                      src={MEDIA_URLS.comboPizzaria}
                      alt="Pizza grande fatiada na caixa acompanhada de refrigerante gelado na mesa"
                      width={960}
                      height={720}
                      loading="lazy"
                      decoding="async"
                      className="aspect-4/3 w-full object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transform-none"
                    />
                    <div className="flex items-center justify-between bg-card px-4 py-3 text-xs">
                      <span className="font-bold text-foreground">
                        Combos com preço fechado
                      </span>
                      {maxComboSavings > 0 && (
                        <span className="rounded-full bg-accent-gold-soft px-2.5 py-0.5 font-bold text-accent-gold-ink tabular-nums">
                          Economize até R$ {formatPrice(maxComboSavings)}
                        </span>
                      )}
                    </div>
                  </div>
                </ScrollReveal>

                <div className="space-y-5 lg:col-span-7">
                  <ScrollReveal className="space-y-1.5" delay={0.05}>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">
                      Combos para compartilhar
                    </p>
                    <h2
                      id="combos-heading"
                      className="font-serif text-3xl font-extrabold text-foreground sm:text-4xl"
                    >
                      Pizza + refrigerante gelado com desconto
                    </h2>
                    <p className="text-sm text-muted-foreground sm:text-base">
                      Você escolhe os sabores das pizzas (inclusive meio a meio)
                      e os refrigerantes na hora de adicionar ao pedido.
                    </p>
                  </ScrollReveal>

                  <StaggerGrid
                    className="grid gap-3 sm:grid-cols-2"
                    stagger={0.06}
                  >
                    {activeCombos.map((combo) => {
                      const savings = roundCurrency(
                        combo.originalPrice - combo.price
                      );
                      return (
                        <StaggerItem key={combo.id} liftOnHover>
                          <div className="flex h-full flex-col justify-between gap-2.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/35">
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-serif text-base font-bold text-foreground">
                                  {combo.name}
                                </h3>
                                {savings > 0 && (
                                  <span className="shrink-0 rounded-full bg-accent-gold-soft px-2 py-0.5 text-[11px] font-bold text-accent-gold-ink tabular-nums">
                                    −R$ {formatPrice(savings)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {combo.items.join(" + ")}
                              </p>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-extrabold text-primary tabular-nums">
                                R$ {formatPrice(combo.price)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through tabular-nums">
                                R$ {formatPrice(combo.originalPrice)}
                              </span>
                            </div>
                          </div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerGrid>

                  <ScrollReveal delay={0.12}>
                    <Link
                      href="/cardapio?cat=combo"
                      className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98]"
                    >
                      <span>Montar combo agora</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </ScrollReveal>
                </div>
              </div>
            </section>
          )}

          {/* DO FORNO À SUA CASA */}
          <section
            id="forno"
            aria-labelledby="forno-heading"
            className="mx-auto max-w-6xl space-y-8 px-4 py-14 sm:px-6 lg:py-16"
          >
            <ScrollReveal className="max-w-2xl space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Do preparo à entrega
              </p>
              <h2
                id="forno-heading"
                className="font-serif text-3xl font-extrabold text-foreground sm:text-4xl"
              >
                Assada na hora e acompanhada etapa por etapa
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Assim que você confirma o pedido online, acompanha em tempo real
                da bancada até o motoboy sair para entrega.
              </p>
            </ScrollReveal>

            <StaggerGrid className="grid gap-6 md:grid-cols-3" stagger={0.09}>
              {processSteps.map((step, idx) => (
                <StaggerItem key={step.title} liftOnHover>
                  <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-shadow duration-200 hover:shadow-md">
                    <div className="aspect-4/3 w-full overflow-hidden bg-secondary">
                      <img
                        src={step.image}
                        alt={step.alt}
                        width={960}
                        height={720}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
                      />
                    </div>
                    <div className="space-y-2 p-5">
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">
                        {idx + 1}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </section>

          {/* HORÁRIO E ENTREGA */}
          <section
            id="visita"
            aria-labelledby="visita-heading"
            className="border-t border-border bg-secondary/45 py-14 lg:py-16"
          >
            <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-12">
              <ScrollReveal className="lg:col-span-7">
                <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">
                      Onde estamos
                    </p>
                    <h2
                      id="visita-heading"
                      className="font-serif text-3xl font-extrabold text-foreground"
                    >
                      {profile.streetDistrict}, {profile.city}
                    </h2>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {statusText}
                    </p>
                  </div>

                  <dl className="divide-y divide-border border-y border-border text-sm">
                    {scheduleRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between gap-4 py-3"
                      >
                        <dt className="font-semibold text-foreground">
                          {row.label}
                        </dt>
                        <dd
                          className={
                            row.isClosed
                              ? "text-muted-foreground"
                              : "font-bold text-foreground tabular-nums"
                          }
                        >
                          {row.hours}
                        </dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4 py-3">
                      <dt className="font-semibold text-foreground">
                        Atendimento
                      </dt>
                      <dd className="text-right text-muted-foreground">
                        Delivery em {activeBairros.length} bairros (
                        {profile.estimatedDelivery}) ou retirada no balcão (
                        {profile.estimatedPickup})
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 py-3">
                      <dt className="font-semibold text-foreground">
                        Pagamento
                      </dt>
                      <dd className="text-right text-muted-foreground">
                        Pix, cartão na entrega ou dinheiro
                      </dd>
                    </div>
                  </dl>

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Bairros atendidos em {profile.city}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeBairros.map((b) => (
                        <span
                          key={b.nome}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          <Check
                            className="size-3 text-status-open"
                            aria-hidden="true"
                          />
                          {b.nome}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <a
                      href={STORE_MAP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                    >
                      <MapPin
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      Ver mapa do bairro
                    </a>
                    <a
                      href={profile.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4 text-primary"
                        aria-hidden="true"
                      >
                        <rect
                          width="20"
                          height="20"
                          x="2"
                          y="2"
                          rx="5"
                          ry="5"
                        />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                      {profile.instagramHandle}
                    </a>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.1} className="lg:col-span-5">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-foreground/5">
                  <img
                    src={MEDIA_URLS.margheritaPrato960}
                    alt="Pizza margherita servida inteira sobre prato artesanal"
                    width={960}
                    height={720}
                    loading="lazy"
                    decoding="async"
                    className="aspect-4/3 w-full object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transform-none"
                  />
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* BANDA FINAL DA MARCA */}
          <section
            aria-labelledby="closing-heading"
            className="bg-primary text-primary-foreground"
          >
            <ScrollReveal className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center lg:py-16">
              <div className="space-y-2">
                <span className="inline-flex rounded-full bg-accent-gold px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Pedido direto sem taxa de app
                </span>
                <h2
                  id="closing-heading"
                  className="font-serif text-3xl font-extrabold text-white sm:text-4xl"
                >
                  Bateu a fome? Monte sua pizza em segundos.
                </h2>
                <p className="max-w-xl text-sm text-white/90 sm:text-base">
                  Escolha inteira ou meio a meio, adicione borda de Catupiry ou
                  Cheddar e acompanhe cada etapa do preparo online.
                </p>
              </div>

              <Link
                href="/cardapio"
                className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 text-sm font-extrabold text-primary shadow-lg transition-[background-color,transform] duration-150 hover:bg-background active:scale-[0.98]"
              >
                <span>Abrir cardápio completo</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </ScrollReveal>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-[#1c1512] text-[#f5ece0]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
            <div className="space-y-3">
              <BrandMark subtitle="Pizzaria Delivery" size="md" inverted />
              <p className="text-sm text-[#c9bdb3]">
                {profile.ovenLabel} · {status.hoursLabel}
              </p>
            </div>

            <div className="space-y-1.5 text-sm">
              <p className="font-bold text-white">Balcão e atendimento</p>
              <p className="text-[#c9bdb3]">{profile.pickupAddress}</p>
              <p>
                <a
                  href={`https://wa.me/${profile.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-gold underline underline-offset-4 hover:text-white"
                >
                  WhatsApp: {profile.whatsappDisplay}
                </a>
              </p>
            </div>

            <div className="space-y-2 text-sm sm:text-right">
              <p>
                <Link
                  href="/cardapio"
                  className="font-semibold text-white underline underline-offset-4 hover:text-accent-gold"
                >
                  Cardápio online ({activePizzas.length} sabores)
                </Link>
              </p>
              <p>
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#c9bdb3] underline underline-offset-4 hover:text-white"
                >
                  Instagram {profile.instagramHandle}
                </a>
              </p>
              <p className="pt-2 text-xs text-[#a99b90]">
                © 2026 {profile.storeName} ·{" "}
                <a
                  href="/credits.html"
                  className="underline underline-offset-2 hover:text-white"
                >
                  Créditos das fotos
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </HomeMotionProvider>
  );
}
