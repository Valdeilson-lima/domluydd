"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { SplitSquareHorizontal, Sparkles } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCatalog } from "@/hooks/useCatalog";
import { useStock } from "@/hooks/useStock";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { filterCombos, filterDrinks, filterPizzas } from "@/lib/catalog";
import type { PizzaSizeKey } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { MenuHeader } from "@/features/menu/components/MenuHeader";
import { ActiveOrderBanner } from "@/features/menu/components/ActiveOrderBanner";
import {
  SearchBar,
  type CatalogSectionTab,
} from "@/features/menu/components/SearchBar";
import { PizzaGrid } from "@/features/menu/components/PizzaGrid";
import { PizzaImage } from "@/features/menu/components/PizzaImage";
import { ComboGrid } from "@/features/menu/components/ComboGrid";
import { ComboModal } from "@/features/menu/components/ComboModal";
import { DrinkGrid } from "@/features/menu/components/DrinkGrid";
import { DetailModal } from "@/features/menu/components/DetailModal";
import { CartBar } from "@/features/menu/components/CartBar";
import { CartSheet } from "@/features/menu/components/CartSheet";
import { CheckoutModal } from "@/features/menu/components/CheckoutModal";
import { MenuFooter } from "@/features/menu/components/MenuFooter";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import type { CartItem, CatalogSnapshot, Combo, Drink, Pizza } from "@/types";
import type { StoreStatusData } from "@/types/store";

const SALGADA_TAGS = [
  "Mais Pedidas",
  "Tradicionais",
  "Especiais",
  "Queijos",
  "Frango",
  "Carne de Sol",
  "Atum",
];
const DOCE_TAGS = ["Mais Pedidas", "Doces"];
const DRINK_TAGS = ["Clássicos", "Cítricos", "Regionais"];

interface ToastNotice {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function MenuCatalog({
  initialCatalog,
  initialStoreStatus,
}: {
  initialCatalog?: CatalogSnapshot;
  initialStoreStatus?: StoreStatusData;
}) {
  const { catalog } = useCatalog(initialCatalog);
  const storeStatus = useStoreStatus(initialStoreStatus);
  const {
    cart,
    totalQty,
    subtotal,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    setCartItems,
  } = useCart();
  const { isPaused: isStockPaused } = useStock();

  const salgadas = useMemo(
    () => catalog.pizzas.filter((p) => p.category === "salgada"),
    [catalog.pizzas]
  );
  const doces = useMemo(
    () => catalog.pizzas.filter((p) => p.category === "doce"),
    [catalog.pizzas]
  );
  const bebidas = catalog.drinks;
  const combos = catalog.combos;

  const isPaused = useCallback(
    (name: string) => {
      if (isStockPaused(name)) return true;
      const pizza = catalog.pizzas.find((p) => p.name === name);
      if (pizza && pizza.available === false) return true;
      const drink = catalog.drinks.find((d) => d.name === name);
      if (drink && drink.available === false) return true;
      const combo = catalog.combos.find((c) => c.name === name);
      if (combo && combo.available === false) return true;
      return false;
    },
    [catalog.combos, catalog.drinks, catalog.pizzas, isStockPaused]
  );

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<CatalogSectionTab>("all");
  const [activeTag, setActiveTag] = useState("Todas");
  const [urlHydrated, setUrlHydrated] = useState(false);

  const [modalState, setModalState] = useState<{
    pizza: Pizza | null;
    initialSize: PizzaSizeKey;
    initialHalf: boolean;
  }>({ pizza: null, initialSize: "m", initialHalf: false });
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const pizzaSlug = params.get("pizza");
    if (pizzaSlug) {
      const found = catalog.pizzas.find((p) => p.slug === pizzaSlug);
      if (found) {
        setModalState({ pizza: found, initialSize: "m", initialHalf: false });
      }
    }
    const cat = params.get("cat") as CatalogSectionTab | null;
    if (cat && ["all", "salgada", "doce", "combo", "bebida"].includes(cat)) {
      setActiveTab(cat);
    }
    const tagParam = params.get("tag");
    if (tagParam) setActiveTag(tagParam);
    const qParam = params.get("q");
    if (qParam) setSearch(qParam);
    setUrlHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!urlHydrated || typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("cat", activeTab);
    if (activeTag !== "Todas") params.set("tag", activeTag);
    if (search.trim()) params.set("q", search.trim());
    const qs = params.toString();
    const nextUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [activeTab, activeTag, search, urlHydrated]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((notice: ToastNotice) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(notice);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const openPizzaModal = useCallback(
    (pizza: Pizza, initialSize: PizzaSizeKey = "m", initialHalf = false) => {
      setModalState({ pizza, initialSize, initialHalf });
    },
    []
  );

  const openHalfAndHalfStarter = useCallback(() => {
    const starter =
      salgadas.find((p) => p.name === "Calabresa" && !isPaused(p.name)) ??
      salgadas.find((p) => !isPaused(p.name)) ??
      salgadas[0];
    if (starter) {
      openPizzaModal(starter, "m", true);
    }
  }, [salgadas, isPaused, openPizzaModal]);

  const featuredHighlights = useMemo(() => {
    const preferred = [
      salgadas.find((p) => p.slug === "calabresa"),
      salgadas.find((p) => p.slug === "carne-de-sol"),
      salgadas.find((p) => p.slug === "4-queijos"),
      doces.find((p) => p.slug === "chocolate"),
    ].filter((p): p is Pizza => Boolean(p));

    if (preferred.length >= 4) return preferred;
    return [
      ...preferred,
      ...catalog.pizzas.filter(
        (p) => p.highlight && !preferred.some((fp) => fp.id === p.id)
      ),
      ...catalog.pizzas.filter((p) => !preferred.some((fp) => fp.id === p.id)),
    ].slice(0, 4);
  }, [catalog.pizzas, doces, salgadas]);

  const counts = useMemo<Record<CatalogSectionTab, number>>(
    () => ({
      all: salgadas.length + doces.length + combos.length + bebidas.length,
      salgada: salgadas.length,
      doce: doces.length,
      combo: combos.length,
      bebida: bebidas.length,
    }),
    [salgadas.length, doces.length, combos.length, bebidas.length]
  );

  const availableTags = useMemo(() => {
    if (activeTab === "salgada") return SALGADA_TAGS;
    if (activeTab === "doce") return DOCE_TAGS;
    if (activeTab === "bebida") return DRINK_TAGS;
    if (activeTab === "all")
      return [
        "Mais Pedidas",
        "Tradicionais",
        "Especiais",
        "Queijos",
        "Carne de Sol",
        "Doces",
      ];
    return [];
  }, [activeTab]);

  const handleTabChange = (next: CatalogSectionTab) => {
    setActiveTab(next);
    setActiveTag("Todas");
  };

  const filteredSalgadas = useMemo(() => {
    if (activeTab !== "all" && activeTab !== "salgada") return [];
    if (activeTag === "Doces") return [];
    return filterPizzas(salgadas, {
      category: "salgada",
      tag: activeTag,
      search,
    });
  }, [salgadas, activeTab, activeTag, search]);

  const filteredDoces = useMemo(() => {
    if (activeTab !== "all" && activeTab !== "doce") return [];
    if (
      activeTag !== "Todas" &&
      activeTag !== "Mais Pedidas" &&
      activeTag !== "Doces"
    ) {
      return [];
    }
    return filterPizzas(doces, { category: "doce", tag: activeTag, search });
  }, [doces, activeTab, activeTag, search]);

  const filteredCombos = useMemo(() => {
    if (activeTab !== "all" && activeTab !== "combo") return [];
    if (activeTag !== "Todas" && activeTab === "all") return [];
    return filterCombos(combos, search);
  }, [combos, activeTab, activeTag, search]);

  const filteredDrinks = useMemo(() => {
    if (activeTab !== "all" && activeTab !== "bebida") return [];
    if (activeTab === "all" && activeTag !== "Todas") return [];
    return filterDrinks(bebidas, {
      tag: activeTab === "bebida" ? activeTag : "Todas",
      search,
    });
  }, [bebidas, activeTab, activeTag, search]);

  const totalResults =
    filteredSalgadas.length +
    filteredDoces.length +
    filteredCombos.length +
    filteredDrinks.length;

  const handleRemoveWithUndo = (index: number) => {
    const previousCart: CartItem[] = [...cart];
    const removed = previousCart[index];
    removeFromCart(index);
    if (removed) {
      showToast({
        message: `${removed.flavors.map((f) => f.name).join(" + ")} removido.`,
        actionLabel: "Desfazer",
        onAction: () => {
          setCartItems(previousCart);
          setToast(null);
        },
      });
    }
  };

  const handleAddDrink = (drink: Drink) => {
    addToCart({
      category: "bebida",
      size: "Único",
      flavors: [{ name: drink.name, price: drink.price }],
      price: drink.price,
    });
    showToast({
      message: `${drink.name} adicionado à sacola.`,
      actionLabel: "Ver sacola",
      onAction: () => {
        setToast(null);
        setCartOpen(true);
      },
    });
  };

  const showCuratedStrip =
    activeTab === "all" && activeTag === "Todas" && !search.trim();

  return (
    <div className="min-h-dvh bg-background pb-24 sm:pb-0">
      <MenuHeader
        totalQty={totalQty}
        subtotal={subtotal}
        onOpenCart={() => setCartOpen(true)}
        initialStoreStatus={storeStatus}
      />

      <ActiveOrderBanner />

      <section
        aria-labelledby="cardapio-hero-heading"
        className="border-b border-border bg-gradient-to-b from-secondary/70 to-background px-4 py-7 sm:px-6 lg:py-10"
      >
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12 lg:items-end">
          <div className="space-y-4 lg:col-span-6">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Don Luydd · Cardápio Digital
            </p>
            <h1
              id="cardapio-hero-heading"
              className="font-serif text-3xl font-extrabold leading-tight text-foreground sm:text-5xl"
            >
              Escolha seu sabor do forno
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {salgadas.length} salgadas, {doces.length} doces, {combos.length}{" "}
              combos com refri e bebidas geladas. Monte inteira ou meio a meio
              com borda recheada.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={openHalfAndHalfStarter}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98]"
              >
                <SplitSquareHorizontal className="size-4" aria-hidden="true" />
                Montar meio a meio
              </button>
              {combos.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange("combo")}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                >
                  <Sparkles
                    className="size-4 text-accent-gold"
                    aria-hidden="true"
                  />
                  Ver {combos.length} {combos.length === 1 ? "combo" : "combos"}
                </button>
              )}
              <InstallAppButton />
            </div>
          </div>

          {showCuratedStrip && (
            <div className="lg:col-span-6">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Atalho das mais pedidas
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {featuredHighlights.map((item) => {
                  const paused = isPaused(item.name);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={paused}
                      onClick={() => openPizzaModal(item, "m", false)}
                      className="group flex min-h-20 items-center gap-3 rounded-xl border border-border bg-card p-2 text-left shadow-xs transition-[border-color,box-shadow,transform] duration-150 hover:border-primary/40 hover:shadow-sm active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <div className="size-15 shrink-0 overflow-hidden rounded-lg bg-secondary sm:size-16">
                        <PizzaImage
                          imgIdx={item.imgIdx}
                          image={item.image}
                          name={item.name}
                          priority
                          className="size-15 object-cover sm:size-16"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-serif text-sm font-bold text-foreground group-hover:text-primary sm:text-base">
                          {item.name}
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground tabular-nums">
                          A partir de R$ {formatPrice(item.p)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <SearchBar
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeTag={activeTag}
        onTagChange={setActiveTag}
        availableTags={availableTags}
        totalResults={totalResults}
        counts={counts}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-4 z-40 flex max-w-sm items-center justify-between gap-3 rounded-xl bg-foreground px-4 py-3 text-xs font-semibold text-white shadow-xl animate-toast-in sm:bottom-6"
        >
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={toast.onAction}
              className="shrink-0 rounded-lg bg-accent-gold px-3 py-1.5 text-xs font-extrabold text-foreground transition-opacity hover:opacity-90"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}

      <main
        id="main-content"
        className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6"
      >
        {totalResults === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-xs">
            <p className="font-serif text-2xl font-bold text-foreground">
              Nenhum item encontrado para essa busca.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente outro ingrediente (ex.: calabresa, catupiry, carne de sol)
              ou exiba todo o cardápio novamente.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveTab("all");
                setActiveTag("Todas");
              }}
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Mostrar todo o cardápio
            </button>
          </div>
        ) : (
          <>
            <PizzaGrid
              id="salgadas"
              title="Pizzas salgadas"
              subtitle="Massa fresca em forno elétrico · Toque para personalizar tamanho, meio a meio e borda"
              pizzas={filteredSalgadas}
              isPaused={isPaused}
              onSelect={(p, sz) => openPizzaModal(p, sz ?? "m", false)}
            />

            <PizzaGrid
              id="doces"
              title="Pizzas doces"
              subtitle="Sobremesas assadas na hora com massa leve e cobertura generosa"
              pizzas={filteredDoces}
              isPaused={isPaused}
              onSelect={(p, sz) => openPizzaModal(p, sz ?? "m", false)}
            />

            <ComboGrid
              combos={filteredCombos}
              isPaused={isPaused}
              onAdd={(combo) => setSelectedCombo(combo)}
            />

            <DrinkGrid
              drinks={filteredDrinks}
              isPaused={isPaused}
              onAdd={handleAddDrink}
            />
          </>
        )}
      </main>

      <MenuFooter
        profile={storeStatus.profile}
        hoursLabel={storeStatus.hoursLabel}
      />

      <DetailModal
        pizza={modalState.pizza}
        allPizzas={catalog.pizzas}
        crusts={catalog.crusts}
        extras={catalog.extras}
        commonRemovals={storeStatus.profile.commonRemovals}
        sweetRemovals={storeStatus.profile.sweetRemovals}
        initialSize={modalState.initialSize}
        initialHalf={modalState.initialHalf}
        onClose={() => setModalState((prev) => ({ ...prev, pizza: null }))}
        isPaused={isPaused}
        onAddToCart={(item) => {
          addToCart(item);
          showToast({
            message: `${item.flavors.map((f) => f.name).join(" + ")} adicionado à sacola.`,
            actionLabel: "Ver sacola",
            onAction: () => {
              setToast(null);
              setCartOpen(true);
            },
          });
        }}
      />

      <ComboModal
        combo={selectedCombo}
        pizzas={catalog.pizzas}
        onClose={() => setSelectedCombo(null)}
        isPaused={isPaused}
        onAddToCart={(item) => {
          addToCart(item);
          showToast({
            message: `${item.flavors.map((f) => f.name).join(" + ")} adicionado à sacola.`,
            actionLabel: "Ver sacola",
            onAction: () => {
              setToast(null);
              setCartOpen(true);
            },
          });
        }}
      />

      <CartBar
        totalQty={totalQty}
        subtotal={subtotal}
        onOpenCart={() => setCartOpen(true)}
      />

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        subtotal={subtotal}
        onUpdateQty={updateQty}
        onRemove={handleRemoveWithUndo}
        onClear={clearCart}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        bairros={catalog.bairros}
        initialStoreStatus={storeStatus}
        onOrderSuccess={clearCart}
      />
    </div>
  );
}
