import { useState, useCallback, useEffect } from "react";
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
import type { Pizza, Drink, CartItem } from "@/types";

type TabId = "salgadas" | "doces" | "bebidas";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("salgadas");
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
      addItem({
        flavors: [{ name: drink.name, price: drink.price }],
        size: "Un",
        price: drink.price,
        category: "Bebida",
      });
      setToastMessage(`${drink.name} adicionada`);
      setToastOpen(true);
    },
    [addItem]
  );

  const handleAddToCart = useCallback(
    (item: Omit<CartItem, "id" | "qty">) => {
      addItem(item);
      const isHalf =
        item.flavors.length > 1 &&
        item.flavors[0].name !== item.flavors[1].name;
      const itemName = isHalf
        ? item.flavors.map((f) => f.name).join(" + ")
        : item.flavors[0].name;
      setToastMessage(`${itemName} (${item.size}) adicionada`);
      setToastOpen(true);
    },
    [addItem]
  );

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      setToastMessage("Seu carrinho está vazio");
      setToastOpen(true);
      return;
    }
    toggleCart(false);
    setCheckoutOpen(true);
  }, [cart, toggleCart]);

  const handleOrderSent = useCallback(() => {
    clearCart();
    toggleCart(false);
    setCheckoutOpen(false);
  }, [clearCart, toggleCart]);

  const pizzaData = activeTab === "salgadas" ? salgadas : doces;
  const totalForTab =
    activeTab === "bebidas" ? bebidas.length : pizzaData.length;

  const filteredPizzas = search
    ? pizzaData.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.desc.toLowerCase().includes(search.toLowerCase())
      )
    : pizzaData;

  const filteredDrinks = search
    ? bebidas.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.desc.toLowerCase().includes(search.toLowerCase())
      )
    : bebidas;

  const resultsCount =
    activeTab === "bebidas" ? filteredDrinks.length : filteredPizzas.length;

  return (
    <>
      <a
        href="#main-content"
        className="absolute -top-25 left-4 z-1000 rounded-sm bg-red-primary px-6 py-3 font-bold text-white no-underline transition-[top] duration-200 focus:top-4"
      >
        Pular para o conteúdo
      </a>

      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      <Hero />
      <InfoStrip />

      <main
        id="main-content"
        className="mx-auto max-w-280 px-4 py-6 pb-24 sm:px-5 sm:py-8 sm:pb-28"
      >
        <SearchBar
          value={search}
          onChange={setSearch}
          resultsCount={resultsCount}
          total={totalForTab}
        />

        <div className="mt-5 sm:mt-7">
          {activeTab !== "bebidas" ? (
            <section
              aria-label={
                activeTab === "salgadas" ? "Pizzas salgadas" : "Pizzas doces"
              }
            >
              <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/6 pb-3 sm:mb-6 sm:pb-4">
                <div className="flex items-baseline gap-2.5">
                  <h2 className="font-display text-[1.6rem] font-semibold italic leading-none tracking-[-0.02em] text-cream [font-variation-settings:'opsz'_144,'SOFT'_30] sm:text-[2rem]">
                    {activeTab === "salgadas" ? "Salgadas" : "Doces"}
                  </h2>
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted">
                    {filteredPizzas.length}{" "}
                    {filteredPizzas.length === 1 ? "sabor" : "sabores"}
                  </span>
                </div>
                <p className="hidden items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-muted sm:flex sm:text-[0.65rem]">
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: "#c5302a" }}
                    />
                    P · 4 fatias
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: "#e89a45" }}
                    />
                    M · 6
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: "#7ba36a" }}
                    />
                    G · 8
                  </span>
                </p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <PizzaGrid
                  pizzas={filteredPizzas}
                  onSelect={handlePizzaSelect}
                />
              </div>
            </section>
          ) : (
            <section aria-label="Bebidas">
              <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/6 pb-3 sm:mb-6 sm:pb-4">
                <div className="flex items-baseline gap-2.5">
                  <h2 className="font-display text-[1.6rem] font-semibold italic leading-none tracking-[-0.02em] text-cream [font-variation-settings:'opsz'_144,'SOFT'_30] sm:text-[2rem]">
                    Bebidas
                  </h2>
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted">
                    {filteredDrinks.length}{" "}
                    {filteredDrinks.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                <p className="font-mono text-[0.6rem] uppercase tracking-wider text-muted sm:text-[0.65rem]">
                  Geladas para acompanhar
                </p>
              </div>
              <DrinkGrid drinks={filteredDrinks} onSelect={handleDrinkSelect} />
            </section>
          )}
        </div>
      </main>

      <Footer />

      <WhatsAppButton cartHasItems={itemCount > 0} hidden={anyOverlayOpen} />

      <CartBar
        itemCount={itemCount}
        total={total}
        onOpen={() => toggleCart(true)}
        hidden={detailOpen || cartOpen || checkoutOpen}
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
