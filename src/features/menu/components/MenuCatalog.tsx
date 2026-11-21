"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { SplitSquareHorizontal, ArrowRight } from "lucide-react";
import { salgadas, doces, getPizzaBySlug } from "@/data/pizzas";
import { bebidas } from "@/data/drinks";
import { combos } from "@/data/combos";
import { useCart } from "@/hooks/useCart";
import { useStock } from "@/hooks/useStock";
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
import { DrinkGrid } from "@/features/menu/components/DrinkGrid";
import { DetailModal } from "@/features/menu/components/DetailModal";
import { CartBar } from "@/features/menu/components/CartBar";
import { CartSheet } from "@/features/menu/components/CartSheet";
import { CheckoutModal } from "@/features/menu/components/CheckoutModal";
import { MenuFooter } from "@/features/menu/components/MenuFooter";
import type { CartItem, Combo, Drink, Pizza } from "@/types";

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

export function MenuCatalog() {
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
  const { isPaused } = useStock();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<CatalogSectionTab>("all");
  const [activeTag, setActiveTag] = useState("Todas");
  const [urlHydrated, setUrlHydrated] = useState(false);

  const [modalState, setModalState] = useState<{
    pizza: Pizza | null;
    initialSize: PizzaSizeKey;
    initialHalf: boolean;
  }>({ pizza: null, initialSize: "m", initialHalf: false });

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const pizzaSlug = params.get("pizza");
    if (pizzaSlug) {
      const found = getPizzaBySlug(pizzaSlug);
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
  }, [isPaused, openPizzaModal]);

  const featuredHighlights = useMemo(
    () => salgadas.filter((p) => p.highlight).slice(0, 4),
    []
  );

  const counts = useMemo<Record<CatalogSectionTab, number>>(
    () => ({
      all: salgadas.length + doces.length + combos.length + bebidas.length,
      salgada: salgadas.length,
      doce: doces.length,
      combo: combos.length,
      bebida: bebidas.length,
    }),
    []
  );

  const availableTags = useMemo(() => {
    if (activeTab === "salgada") return SALGADA_TAGS;
    if (activeTab === "doce") return DOCE_TAGS;
    if (activeTab === "bebida") return DRINK_TAGS;
    if (activeTab === "all")
      return ["Mais Pedidas", "Tradicionais", "Especiais", "Queijos", "Doces"];
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
  }, [activeTab, activeTag, search]);

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
  }, [activeTab, activeTag, search]);

  const filteredCombos = useMemo(() => {
    if (activeTab !== "all" && activeTab !== "combo") return [];
    if (activeTag !== "Todas" && activeTab === "all") return [];
    return filterCombos(combos, search);
  }, [activeTab, activeTag, search]);

  const filteredDrinks = useMemo(() => {
    if (activeTab !== "all" && activeTab !== "bebida") return [];
    if (activeTab === "all" && activeTag !== "Todas") return [];
    return filterDrinks(bebidas, {
      tag: activeTab === "bebida" ? activeTag : "Todas",
      search,
    });
  }, [activeTab, activeTag, search]);

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

  const handleAddCombo = (combo: Combo) => {
    addToCart({
      category: "combo",
      size: "Combo",
      flavors: [{ name: combo.name, price: combo.price }],
      price: combo.price,
    });
    showToast({
      message: `${combo.name} adicionado à sacola.`,
      actionLabel: "Ver sacola",
      onAction: () => {
        setToast(null);
        setCartOpen(true);
      },
    });
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
      />

      <ActiveOrderBanner />

      <section
        aria-labelledby="cardapio-hero-heading"
        className="border-b border-border bg-secondary/45 px-4 py-8 sm:px-6 lg:py-10"
      >
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-12 lg:items-end">
          <div className="space-y-4 lg:col-span-6">
            <h1
              id="cardapio-hero-heading"
              className="font-serif text-3xl font-medium leading-tight text-foreground sm:text-5xl"
            >
              Cardápio do forno
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              32 pizzas salgadas, 6 doces, 4 combos e bebidas geladas. Toque em
              qualquer tamanho ou monte sua meio a meio agora.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={openHalfAndHalfStarter}
                className="inline-flex min-h-11 items-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]"
                style={{ borderRadius: "2px" }}
              >
                <SplitSquareHorizontal className="size-4" aria-hidden="true" />
                Montar pizza meio a meio
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("combo")}
                className="inline-flex min-h-11 items-center gap-1.5 border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-foreground hover:bg-secondary"
                style={{ borderRadius: "2px" }}
              >
                Ver 4 combos
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {showCuratedStrip && (
            <div className="lg:col-span-6">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Atalho das mais pedidas
              </p>
              <div className="grid grid-cols-2 gap-3">
                {featuredHighlights.map((item) => {
                  const paused = isPaused(item.name);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={paused}
                      onClick={() => openPizzaModal(item, "m", false)}
                      className="group flex min-h-20 items-center gap-3 border border-border bg-card p-2 text-left transition-[border-color,background-color,transform] duration-150 hover:border-foreground hover:bg-background active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
                      style={{ borderRadius: "2px" }}
                    >
                      <div className="size-16 shrink-0 overflow-hidden bg-secondary">
                        <PizzaImage
                          imgIdx={item.imgIdx}
                          name={item.name}
                          priority
                          className="size-16 object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-serif text-base text-foreground group-hover:underline">
                          {item.name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground tabular-nums">
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
          className="fixed bottom-20 right-4 z-40 flex max-w-sm items-center justify-between gap-3 border border-foreground bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-md animate-toast-in sm:bottom-6"
          style={{ borderRadius: "2px" }}
        >
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={toast.onAction}
              className="shrink-0 border border-primary-foreground/40 bg-primary-foreground/10 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-primary"
              style={{ borderRadius: "2px" }}
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
          <div className="border border-border bg-card p-10 text-center">
            <p className="font-serif text-2xl text-foreground">
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
              className="mt-5 inline-flex min-h-11 items-center border border-foreground bg-secondary px-5 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              style={{ borderRadius: "2px" }}
            >
              Mostrar todo o cardápio
            </button>
          </div>
        ) : (
          <>
            <PizzaGrid
              id="salgadas"
              title="Pizzas salgadas"
              subtitle="Massa fresca em forno elétrico · Clique em P, M ou G para já abrir no tamanho escolhido"
              pizzas={filteredSalgadas}
              isPaused={isPaused}
              onSelect={(p, sz) => openPizzaModal(p, sz ?? "m", false)}
            />

            <PizzaGrid
              id="doces"
              title="Pizzas doces"
              subtitle="Sobremesas assadas na hora com massa leve"
              pizzas={filteredDoces}
              isPaused={isPaused}
              onSelect={(p, sz) => openPizzaModal(p, sz ?? "m", false)}
            />

            <ComboGrid
              combos={filteredCombos}
              isPaused={isPaused}
              onAdd={handleAddCombo}
            />

            <DrinkGrid
              drinks={filteredDrinks}
              isPaused={isPaused}
              onAdd={handleAddDrink}
            />
          </>
        )}
      </main>

      <MenuFooter />

      <DetailModal
        pizza={modalState.pizza}
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
        onOrderSuccess={clearCart}
      />
    </div>
  );
}
