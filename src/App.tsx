import { useState, useCallback, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { Hero, InfoStrip } from "@/components/Hero";
import { SearchBar } from "@/components/SearchBar";
import { PizzaGrid } from "@/components/PizzaGrid";
import { DrinkGrid } from "@/components/DrinkGrid";
import { DetailModal } from "@/components/DetailModal";
import { CartSheet } from "@/components/CartSheet";
import { CartBar } from "@/components/CartBar";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toast } from "@/components/ui/toast";
import { setToastFn } from "@/components/ui/toast-helpers";
import { useCart } from "@/hooks/useCart";
import { salgadas, doces, allPizzas } from "@/data/pizzas";
import { bebidas } from "@/data/drinks";
import { isStoreOpen } from "@/lib/utils";
import type { Pizza, Drink, CartItem } from "@/types";

type TabId = "salgadas" | "doces" | "bebidas";

const TAGS_MAP: Record<TabId, string[]> = {
  salgadas: [
    "Todas",
    "Mais Pedidas",
    "Queijos",
    "Frango",
    "Calabresa",
    "Especiais",
  ],
  doces: ["Todas", "Chocolate", "Frutas"],
  bebidas: ["Todas", "Refrigerante 2L", "Refrigerante 1L", "Sem Açúcar"],
};

const HIGHLIGHT_FLAVORS = [
  "Calabresa",
  "4 Queijos",
  "Frango Catupiry",
  "Marguerita",
  "Portuguesa",
  "Brigadeiro",
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("salgadas");
  const [activeTag, setActiveTag] = useState<string>("Todas");
  const [search, setSearch] = useState("");
  const [selectedPizza, setSelectedPizza] = useState<Pizza | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const {
    cart,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    total,
    itemCount,
    cartOpen,
    toggleCart,
  } = useCart();

  useEffect(() => {
    setToastFn((msg: string) => {
      setToastMessage(msg);
      setToastOpen(true);
    });
  }, []);

  const anyOverlayOpen = detailOpen || cartOpen || checkoutOpen;

  useEffect(() => {
    if (anyOverlayOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [anyOverlayOpen]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as TabId);
    setSearch("");
    setActiveTag("Todas");
  }, []);

  const handlePizzaSelect = useCallback((id: string) => {
    const pizza = allPizzas.find((p) => p.id === id);
    if (pizza) {
      setSelectedPizza(pizza);
      setDetailOpen(true);
    }
  }, []);

  const handleDrinkSelect = useCallback(
    (drink: Drink) => {
      if (!isStoreOpen()) {
        setToastMessage("Loja fechada — volte no horário de funcionamento");
        setToastOpen(true);
        return;
      }
      addItem({
        flavors: [{ name: drink.name, price: drink.price }],
        size: "Un",
        price: drink.price,
        category: "Bebida",
      });
      setToastMessage(`${drink.name} adicionada à sacola`);
      setToastOpen(true);
    },
    [addItem]
  );

  const handleAddToCart = useCallback(
    (item: Omit<CartItem, "id" | "qty">, qty = 1) => {
      if (!isStoreOpen()) {
        setToastMessage("Loja fechada — volte no horário de funcionamento");
        setToastOpen(true);
        return;
      }
      addItem(item, qty);
      const isHalf =
        item.flavors.length > 1 &&
        item.flavors[0].name !== item.flavors[1].name;
      const itemName = isHalf
        ? `${item.flavors[0].name} + ${item.flavors[1].name}`
        : item.flavors[0].name;
      setToastMessage(
        qty > 1
          ? `${qty}x ${itemName} (${item.size}) adicionadas à sacola`
          : `${itemName} (${item.size}) adicionada à sacola`
      );
      setToastOpen(true);
    },
    [addItem]
  );

  const handleOrderSent = useCallback(() => {
    clearCart();
    toggleCart(false);
    setCheckoutOpen(false);
  }, [clearCart, toggleCart]);

  const pizzaData = activeTab === "salgadas" ? salgadas : doces;
  const totalForTab =
    activeTab === "bebidas" ? bebidas.length : pizzaData.length;

  const filteredPizzas = useMemo(() => {
    let list = pizzaData;

    if (activeTag !== "Todas") {
      if (activeTag === "Mais Pedidas") {
        list = list.filter((p) => HIGHLIGHT_FLAVORS.includes(p.name));
      } else if (activeTag === "Queijos") {
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes("queijo") ||
            p.name.toLowerCase().includes("catupiry") ||
            p.desc.toLowerCase().includes("provolone") ||
            p.desc.toLowerCase().includes("parmesão")
        );
      } else if (activeTag === "Frango") {
        list = list.filter((p) => p.name.toLowerCase().includes("frango"));
      } else if (activeTag === "Calabresa") {
        list = list.filter((p) => p.name.toLowerCase().includes("calabresa"));
      } else if (activeTag === "Especiais") {
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes("moda") ||
            p.name.toLowerCase().includes("crocante") ||
            p.desc.toLowerCase().includes("bacon") ||
            p.desc.toLowerCase().includes("ovo")
        );
      } else if (activeTag === "Chocolate") {
        list = list.filter(
          (p) =>
            p.desc.toLowerCase().includes("chocolate") ||
            p.name.toLowerCase().includes("brigadeiro") ||
            p.name.toLowerCase().includes("prestígio")
        );
      } else if (activeTag === "Frutas") {
        list = list.filter(
          (p) =>
            p.desc.toLowerCase().includes("goiabada") ||
            p.name.toLowerCase().includes("romeu")
        );
      }
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );
  }, [pizzaData, search, activeTag]);

  const filteredDrinks = useMemo(() => {
    let list = bebidas;

    if (activeTag !== "Todas") {
      if (activeTag === "Refrigerante 2L") {
        list = list.filter(
          (d) =>
            d.desc.toLowerCase().includes("2 litros") ||
            d.desc.toLowerCase().includes("2l")
        );
      } else if (activeTag === "Refrigerante 1L") {
        list = list.filter(
          (d) =>
            d.desc.toLowerCase().includes("1 litro") ||
            d.desc.toLowerCase().includes("1l")
        );
      } else if (activeTag === "Sem Açúcar") {
        list = list.filter(
          (d) =>
            d.name.toLowerCase().includes("zero") ||
            d.desc.toLowerCase().includes("zero")
        );
      }
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q)
    );
  }, [search, activeTag]);

  const storeOpen = isStoreOpen();

  const handleCheckout = useCallback(() => {
    if (!storeOpen) {
      setToastMessage("Loja fechada — volte no horário de funcionamento");
      setToastOpen(true);
      return;
    }
    if (cart.length === 0) {
      setToastMessage("Seu carrinho está vazio");
      setToastOpen(true);
      return;
    }
    toggleCart(false);
    setCheckoutOpen(true);
  }, [cart, toggleCart, storeOpen]);

  const resultsCount =
    activeTab === "bebidas" ? filteredDrinks.length : filteredPizzas.length;

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setActiveTag("Todas");
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="absolute -top-25 left-4 z-1000 rounded-lg bg-red-primary px-6 py-3 font-bold text-white no-underline transition-[top] duration-200 focus:top-4 shadow-lg ring-2 ring-yellow"
      >
        Pular para o cardápio
      </a>

      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        itemCount={itemCount}
        onCartOpen={() => toggleCart(true)}
      />

      <Hero />
      <InfoStrip />

      <main
        id="main-content"
        className="mx-auto max-w-280 px-4 py-8 pb-28 sm:px-6 sm:py-10 sm:pb-32"
      >
        {/* Search & Filter Bar */}
        <SearchBar
          value={search}
          onChange={setSearch}
          resultsCount={resultsCount}
          total={totalForTab}
          tags={TAGS_MAP[activeTab]}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
        />

        {/* Catalog Section */}
        <div className="mt-7 sm:mt-9">
          {activeTab !== "bebidas" ? (
            <section
              aria-label={
                activeTab === "salgadas"
                  ? "Pizzas artesanais salgadas"
                  : "Pizzas doces especiais"
              }
            >
              {/* Category Header with legend */}
              <div className="mb-6 flex flex-col gap-2 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display text-2xl font-bold italic leading-none tracking-[-0.02em] text-cream [font-variation-settings:'opsz'_144,'SOFT'_30] sm:text-3xl">
                    {activeTab === "salgadas"
                      ? "Pizzas Salgadas"
                      : "Pizzas Doces"}
                  </h2>
                  <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-yellow/90">
                    {filteredPizzas.length}{" "}
                    {filteredPizzas.length === 1 ? "opção" : "opções"}
                  </span>
                </div>

                {/* Size guide legend */}
                <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wider text-muted sm:text-[0.68rem]">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: "#d90416" }}
                    />
                    P · 4 fatias (1 pessoa)
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: "#f28705" }}
                    />
                    M · 6 fatias (2-3 pess.)
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: "#f2b705" }}
                    />
                    G · 8 fatias (3-4 pess.)
                  </span>
                </div>
              </div>

              <PizzaGrid
                pizzas={filteredPizzas}
                onSelect={handlePizzaSelect}
                onClearFilters={handleClearFilters}
              />
            </section>
          ) : (
            <section aria-label="Bebidas geladas">
              <div className="mb-6 flex items-end justify-between border-b border-white/8 pb-4 sm:pb-5">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display text-2xl font-bold italic leading-none tracking-[-0.02em] text-cream [font-variation-settings:'opsz'_144,'SOFT'_30] sm:text-3xl">
                    Bebidas
                  </h2>
                  <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-yellow/90">
                    {filteredDrinks.length}{" "}
                    {filteredDrinks.length === 1 ? "opção" : "opções"}
                  </span>
                </div>

                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                  Entregues bem geladas
                </p>
              </div>

              <DrinkGrid
                drinks={filteredDrinks}
                onSelect={handleDrinkSelect}
                onClearFilters={handleClearFilters}
              />
            </section>
          )}
        </div>
      </main>

      <Footer />

      <WhatsAppButton
        cartHasItems={itemCount > 0}
        hidden={anyOverlayOpen || !storeOpen}
      />

      <CartBar
        itemCount={itemCount}
        total={total}
        onOpen={() => toggleCart(true)}
        hidden={detailOpen || cartOpen || checkoutOpen || !storeOpen}
      />

      <DetailModal
        key={selectedPizza?.id ?? "none"}
        pizza={selectedPizza}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddToCart={handleAddToCart}
      />

      <CartSheet
        open={cartOpen}
        cart={cart}
        total={total}
        itemCount={itemCount}
        onClose={() => toggleCart(false)}
        onRemove={removeItem}
        onUpdateQty={updateQty}
        onCheckout={handleCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        cart={cart}
        total={total}
        storeOpen={storeOpen}
        onAddDrink={handleDrinkSelect}
        onClose={() => setCheckoutOpen(false)}
        onOrderSent={handleOrderSent}
      />

      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
      />
    </>
  );
}
