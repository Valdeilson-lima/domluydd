"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useCatalog } from "@/hooks/useCatalog";
import { useStock } from "@/hooks/useStock";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { MenuHeader } from "@/features/menu/components/MenuHeader";
import { PizzaImage } from "@/features/menu/components/PizzaImage";
import { PizzaConfigurator } from "@/features/menu/components/PizzaConfigurator";
import { CartBar } from "@/features/menu/components/CartBar";
import { CartSheet } from "@/features/menu/components/CartSheet";
import { CheckoutModal } from "@/features/menu/components/CheckoutModal";
import { MenuFooter } from "@/features/menu/components/MenuFooter";
import { formatPrice } from "@/lib/utils";
import type { CartItem, CatalogSnapshot, Pizza } from "@/types";
import type { StoreStatusData } from "@/types/store";

interface ToastNotice {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PizzaDetailClient({
  pizza,
  initialCatalog,
  initialStoreStatus,
}: {
  pizza: Pizza;
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

  const isPaused = (name: string) => {
    if (isStockPaused(name)) return true;
    const item = catalog.pizzas.find((p) => p.name === name);
    return item?.available === false;
  };

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const related = catalog.pizzas
    .filter((p) => p.category === pizza.category && p.id !== pizza.id)
    .slice(0, 3);

  const showToast = (notice: ToastNotice) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(notice);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4000);
  };

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

  return (
    <div className="min-h-dvh bg-background pb-24 sm:pb-0">
      <MenuHeader
        totalQty={totalQty}
        subtotal={subtotal}
        onOpenCart={() => setCartOpen(true)}
        backHref="/cardapio"
        backLabel="Cardápio"
        alwaysShowBackLabel
        initialStoreStatus={storeStatus}
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
        <nav
          aria-label="Navegação estrutural"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/cardapio" className="hover:text-primary">
            Cardápio
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-bold text-foreground" aria-current="page">
            {pizza.name}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <PizzaImage
                imgIdx={pizza.imgIdx}
                image={pizza.image}
                name={pizza.name}
                priority
              />
              <div className="space-y-2.5 p-5">
                <span className="inline-flex rounded-full bg-accent-gold-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-gold-ink">
                  {pizza.category === "doce" ? "Pizza doce" : "Pizza salgada"}
                </span>
                <h1 className="font-serif text-3xl font-extrabold text-foreground">
                  {pizza.name}
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pizza.desc}
                </p>
                <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3.5 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Pequena (4)</dt>
                    <dd className="text-sm font-extrabold text-foreground tabular-nums">
                      R$ {formatPrice(pizza.p)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Média (6)</dt>
                    <dd className="text-sm font-extrabold text-foreground tabular-nums">
                      R$ {formatPrice(pizza.m)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Grande (8)</dt>
                    <dd className="text-sm font-extrabold text-foreground tabular-nums">
                      R$ {formatPrice(pizza.g)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6 lg:col-span-7">
            <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
              Personalize tamanho, borda e adicionais
            </h2>
            <PizzaConfigurator
              pizza={pizza}
              allPizzas={catalog.pizzas}
              crusts={catalog.crusts}
              extras={catalog.extras}
              commonRemovals={storeStatus.profile.commonRemovals}
              sweetRemovals={storeStatus.profile.sweetRemovals}
              isPaused={isPaused}
              onConfirm={(item) => {
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
          </div>
        </div>

        <section className="space-y-4 border-t border-border pt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Outros sabores {pizza.category === "doce" ? "doces" : "salgados"}
            </h2>
            <Link
              href="/cardapio"
              className="text-xs font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              Ver todo o cardápio
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/pizza/${item.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <PizzaImage
                  imgIdx={item.imgIdx}
                  image={item.image}
                  name={item.name}
                />
                <div className="p-4">
                  <p className="font-serif text-lg font-bold text-foreground group-hover:text-primary">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">
                    A partir de R$ {formatPrice(item.p)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <MenuFooter
        profile={storeStatus.profile}
        hoursLabel={storeStatus.hoursLabel}
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
