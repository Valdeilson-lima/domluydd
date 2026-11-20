"use client";

import { useState } from "react";
import Link from "next/link";
import { allPizzas } from "@/data/pizzas";
import { useCart } from "@/hooks/useCart";
import { useStock } from "@/hooks/useStock";
import { MenuHeader } from "@/features/menu/components/MenuHeader";
import { PizzaImage } from "@/features/menu/components/PizzaImage";
import { PizzaConfigurator } from "@/features/menu/components/PizzaConfigurator";
import { CartBar } from "@/features/menu/components/CartBar";
import { CartSheet } from "@/features/menu/components/CartSheet";
import { CheckoutModal } from "@/features/menu/components/CheckoutModal";
import { MenuFooter } from "@/features/menu/components/MenuFooter";
import { formatPrice } from "@/lib/utils";
import type { Pizza } from "@/types";

export function PizzaDetailClient({ pizza }: { pizza: Pizza }) {
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

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const related = allPizzas
    .filter((p) => p.category === pizza.category && p.id !== pizza.id)
    .slice(0, 3);

  const showToast = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => {
      setFeedback((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <MenuHeader
        totalQty={totalQty}
        subtotal={subtotal}
        onOpenCart={() => setCartOpen(true)}
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
        <nav
          aria-label="Navegação estrutural"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground">
            Casa
          </Link>
          <span>/</span>
          <Link href="/cardapio" className="hover:text-foreground">
            Cardápio
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground">{pizza.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-5">
            <PizzaImage imgIdx={pizza.imgIdx} name={pizza.name} />
            <div className="border border-border bg-card p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {pizza.category === "doce" ? "Pizza doce" : "Pizza salgada"}
              </p>
              <h1 className="font-serif text-3xl font-normal text-foreground">
                {pizza.name}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {pizza.desc}
              </p>
              <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Pequena (4)</dt>
                  <dd className="font-mono font-semibold text-foreground tabular-nums">
                    R$ {formatPrice(pizza.p)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Média (6)</dt>
                  <dd className="font-mono font-semibold text-foreground tabular-nums">
                    R$ {formatPrice(pizza.m)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Grande (8)</dt>
                  <dd className="font-mono font-semibold text-foreground tabular-nums">
                    R$ {formatPrice(pizza.g)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border border-border bg-background p-5 sm:p-6 lg:col-span-7">
            <h2 className="mb-4 font-serif text-2xl font-normal text-foreground">
              Personalize tamanho, borda e adicionais
            </h2>
            <PizzaConfigurator
              pizza={pizza}
              isPaused={isPaused}
              onConfirm={(item) => {
                addToCart(item);
                showToast(
                  `${item.flavors.map((f) => f.name).join(" + ")} adicionado à sacola.`
                );
              }}
            />
          </div>
        </div>

        <section className="space-y-4 border-t border-border pt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-normal text-foreground">
              Outros sabores {pizza.category === "doce" ? "doces" : "salgados"}
            </h2>
            <Link
              href="/cardapio"
              className="text-xs font-semibold underline underline-offset-4"
            >
              Ver todo o cardápio
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/pizza/${item.slug}`}
                className="group border border-border bg-card transition-colors hover:border-foreground"
              >
                <PizzaImage imgIdx={item.imgIdx} name={item.name} />
                <div className="p-4">
                  <p className="font-serif text-lg text-foreground group-hover:underline">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A partir de R$ {formatPrice(item.p)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <MenuFooter />

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
