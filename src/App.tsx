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

  const { cart, addItem, removeItem, clearCart, total, cartOpen, toggleCart } =
    useCart();

  useEffect(() => {
    setToastFn((msg: string) => {
      setToastMessage(msg);
      setToastOpen(true);
    });
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
      setToastMessage(`${drink.name} adicionada!`);
      setToastOpen(true);
    },
    [addItem]
  );

  const handleAddToCart = useCallback(
    (item: Omit<CartItem, "id">) => {
      addItem(item);
      const isHalf =
        item.flavors.length > 1 &&
        item.flavors[0].name !== item.flavors[1].name;
      const itemName = isHalf
        ? item.flavors.map((f) => f.name).join(" + ")
        : item.flavors[0].name;
      setToastMessage(`${itemName} (${item.size}) adicionada!`);
      setToastOpen(true);
    },
    [addItem]
  );

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      setToastMessage("Seu carrinho está vazio!");
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

  const filteredPizzas = search
    ? pizzaData.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.desc.toLowerCase().includes(search.toLowerCase())
      )
    : pizzaData;

  return (
    <>
      <a
        href="#main-content"
        className="absolute -top-[100px] left-4 z-[1000] rounded-[8px] bg-red-primary px-6 py-3 font-bold text-white no-underline transition-[top] duration-200 focus:top-4"
      >
        Pular para o conteúdo
      </a>

      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
      />

      <Hero />
      <InfoStrip />

      <main
        id="main-content"
        className="mx-auto max-w-[1120px] px-4 py-6 pb-24 sm:px-5 sm:py-8 sm:pb-28"
      >
        <SearchBar value={search} onChange={setSearch} />

        <div className="mt-5 sm:mt-7">
          {activeTab !== "bebidas" ? (
            <section
              aria-label={
                activeTab === "salgadas" ? "Pizzas salgadas" : "Pizzas doces"
              }
            >
              <div className="mb-4 flex items-baseline justify-between gap-2 flex-wrap sm:mb-6">
                <h2 className="font-display text-xl font-extrabold -tracking-[0.02em] sm:text-[1.6rem]">
                  {activeTab === "salgadas" ? "Salgadas" : "Doces"}
                </h2>
                <p className="text-[0.65rem] text-muted font-normal sm:text-xs">
                  P{" "}
                  <span
                    className="mx-0.5 inline-block size-1.5 rounded-full align-middle sm:size-2"
                    style={{ background: "#c73b2a" }}
                  />
                  4 fatias &middot; M
                  <span
                    className="mx-0.5 inline-block size-1.5 rounded-full align-middle sm:size-2"
                    style={{ background: "#d4a54a" }}
                  />
                  6 fatias &middot; G
                  <span
                    className="mx-0.5 inline-block size-1.5 rounded-full align-middle sm:size-2"
                    style={{ background: "#3d7a4a" }}
                  />
                  8 fatias
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
              <div className="mb-4 flex items-baseline justify-between gap-2 flex-wrap sm:mb-6">
                <h2 className="font-display text-xl font-extrabold -tracking-[0.02em] sm:text-[1.6rem]">
                  Bebidas
                </h2>
                <p className="text-[0.65rem] text-muted font-normal sm:text-xs">
                  Refrigerantes gelados para acompanhar
                </p>
              </div>
              <DrinkGrid drinks={bebidas} onSelect={handleDrinkSelect} />
            </section>
          )}
        </div>
      </main>

      <Footer />

      <WhatsAppButton />

      <CartBar
        itemCount={cart.length}
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
        onClose={() => toggleCart(false)}
        onRemove={removeItem}
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
