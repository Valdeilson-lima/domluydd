"use client";

import { useState, useMemo, useEffect } from "react";
import { salgadas, doces, getPizzaBySlug } from "@/data/pizzas";
import { bebidas } from "@/data/drinks";
import { combos } from "@/data/combos";
import { useCart } from "@/hooks/useCart";
import { useStock } from "@/hooks/useStock";
import { filterCombos, filterDrinks, filterPizzas } from "@/lib/catalog";
import { MenuHeader } from "@/features/menu/components/MenuHeader";
import { ActiveOrderBanner } from "@/features/menu/components/ActiveOrderBanner";
import {
  SearchBar,
  type CatalogSectionTab,
} from "@/features/menu/components/SearchBar";
import { PizzaGrid } from "@/features/menu/components/PizzaGrid";
import { ComboGrid } from "@/features/menu/components/ComboGrid";
import { DrinkGrid } from "@/features/menu/components/DrinkGrid";
import { DetailModal } from "@/features/menu/components/DetailModal";
import { CartBar } from "@/features/menu/components/CartBar";
import { CartSheet } from "@/features/menu/components/CartSheet";
import { CheckoutModal } from "@/features/menu/components/CheckoutModal";
import { MenuFooter } from "@/features/menu/components/MenuFooter";
import type { Combo, Drink, Pizza } from "@/types";

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

export function MenuCatalog() {
  const {
    cart,
    totalQty,
    subtotal,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
  } = useCart();
  const { isPaused } = useStock();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<CatalogSectionTab>("all");
  const [activeTag, setActiveTag] = useState("Todas");
  const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const pizzaSlug = params.get("pizza");
    if (pizzaSlug) {
      const found = getPizzaBySlug(pizzaSlug);
      if (found) setSelectedPizza(found);
    }
    const cat = params.get("cat") as CatalogSectionTab | null;
    if (cat && ["all", "salgada", "doce", "combo", "bebida"].includes(cat)) {
      setActiveTab(cat);
    }
    setSearch(params.get("q") || "");
    const tag = params.get("tag");
    if (tag) setActiveTag(tag);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (activeTab !== "all") params.set("cat", activeTab);
    if (activeTag !== "Todas") params.set("tag", activeTag);
    const next = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${next ? `?${next}` : ""}`
    );
  }, [search, activeTab, activeTag]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => {
      setFeedback((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

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

  const handleAddCombo = (combo: Combo) => {
    addToCart({
      category: "combo",
      size: "Combo",
      flavors: [{ name: combo.name, price: combo.price }],
      price: combo.price,
    });
    showToast(`${combo.name} adicionado à sacola.`);
  };

  const handleAddDrink = (drink: Drink) => {
    addToCart({
      category: "bebida",
      size: "Único",
      flavors: [{ name: drink.name, price: drink.price }],
      price: drink.price,
    });
    showToast(`${drink.name} adicionado à sacola.`);
  };

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <MenuHeader
        totalQty={totalQty}
        subtotal={subtotal}
        onOpenCart={() => setCartOpen(true)}
      />

      <ActiveOrderBanner />

      <div className="border-b border-border bg-secondary/40 px-4 py-9 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start gap-4 sm:gap-6">
            <span
              className="mt-1 hidden h-16 w-16 shrink-0 rounded-full border-[5px] border-foreground/90 sm:block"
              aria-hidden="true"
            />
            <div className="max-w-3xl space-y-3">
              <p className="dluydd-section-line text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Cardápio completo · Ter–Dom, 18h às 22h
              </p>
              <h1 className="font-serif text-4xl font-normal leading-[1.05] text-foreground sm:text-6xl">
                Monte a sua mesa.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Trinta e duas pizzas salgadas, seis doces, quatro combos e
                bebidas geladas. Escolha inteira ou meio a meio nas médias e
                grandes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SearchBar
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeTag={activeTag}
        onTagChange={setActiveTag}
        availableTags={availableTags}
        totalResults={totalResults}
      />

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-20 z-40 border border-foreground bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm"
        >
          {feedback}
        </div>
      )}

      <main
        id="conteudo-principal"
        className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6"
      >
        {totalResults === 0 ? (
          <div className="border border-border bg-card p-8 text-center">
            <p className="font-serif text-xl text-foreground">
              Nenhum item encontrado com esse filtro.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveTab("all");
                setActiveTag("Todas");
              }}
              className="mt-4 inline-flex h-10 items-center border border-foreground bg-secondary px-4 text-xs font-semibold text-foreground"
              style={{ borderRadius: "2px" }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            <PizzaGrid
              title="Pizzas salgadas"
              subtitle="Massa fresca em forno elétrico · Tamanhos P, M e G"
              pizzas={filteredSalgadas}
              isPaused={isPaused}
              onSelect={(p) => setSelectedPizza(p)}
            />

            <PizzaGrid
              title="Pizzas doces"
              subtitle="Sobremesas assadas na hora com massa leve"
              pizzas={filteredDoces}
              isPaused={isPaused}
              onSelect={(p) => setSelectedPizza(p)}
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
        pizza={selectedPizza}
        onClose={() => setSelectedPizza(null)}
        isPaused={isPaused}
        onAddToCart={(item) => {
          addToCart(item);
          showToast(
            `${item.flavors.map((f) => f.name).join(" + ")} adicionado à sacola.`
          );
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
        onRemove={removeFromCart}
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
