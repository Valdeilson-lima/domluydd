"use client";

import {
  X,
  ShoppingBag,
  Pizza,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Wine,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { CartItem, Drink } from "@/types";
import { useEffect, useRef } from "react";
import { bebidas } from "@/data/drinks";

interface CartSheetProps {
  open: boolean;
  cart: CartItem[];
  total: number;
  itemCount: number;
  onClose: () => void;
  onRemove: (id: number) => void;
  onUpdateQty: (id: number, delta: number) => void;
  onCheckout: () => void;
  onAddDrink?: (drink: Drink) => void;
}

export function CartSheet({
  open,
  cart,
  total,
  itemCount,
  onClose,
  onRemove,
  onUpdateQty,
  onCheckout,
  onAddDrink,
}: CartSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const hasDrink = cart.some((i) => i.category === "Bebida");
  const quickDrinks = bebidas.slice(0, 2);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={`fixed inset-0 z-400 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        className={`fixed inset-y-0 right-0 z-500 flex w-full max-w-md flex-col bg-[#161415] border-l border-yellow/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-sm bg-yellow/15 text-yellow">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-cream sm:text-lg">
                Sua Sacola
              </h3>
              <span className="font-mono text-[0.62rem] uppercase tracking-wider text-muted">
                {itemCount}{" "}
                {itemCount === 1 ? "item adicionado" : "itens adicionados"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-sm border border-white/10 bg-white/4 text-muted transition-all duration-200 hover:border-yellow/50 hover:bg-yellow/15 hover:text-yellow active:scale-90"
            aria-label="Fechar carrinho"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-sm bg-white/4 ring-1 ring-white/10">
                <Pizza className="size-8 text-muted/50" />
              </div>
              <p className="font-display text-lg font-bold text-cream">
                Sua sacola está vazia
              </p>
              <span className="mt-1 max-w-xs text-xs text-muted leading-relaxed">
                Explore nosso cardápio de pizzas artesanais de fermentação
                natural e adicione seus sabores favoritos.
              </span>
              <button
                onClick={onClose}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-sm bg-yellow/15 px-5 py-2.5 font-mono text-xs font-bold text-yellow transition-all duration-200 hover:bg-yellow/25 active:scale-95"
              >
                Ver cardápio
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((item) => {
                const isHalf =
                  item.flavors.length > 1 &&
                  item.flavors[0].name !== item.flavors[1].name;
                const isDrink = item.category === "Bebida";

                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2.5 rounded-sm border border-white/8 bg-white/2 p-3.5 shadow-sm transition-all duration-200 hover:border-white/15"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Title */}
                        <div className="flex items-baseline gap-2">
                          <h4 className="font-display text-sm font-bold text-cream sm:text-base">
                            {isHalf
                              ? `${item.flavors[0].name} + ${item.flavors[1].name}`
                              : item.flavors[0].name}
                          </h4>
                        </div>

                        {/* Badges */}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-sm border border-white/10 bg-white/4 px-1.5 py-0.2 font-mono text-[0.62rem] font-bold text-cream-dim">
                            {isDrink ? "Bebida" : `Tamanho ${item.size}`}
                          </span>

                          {isHalf && (
                            <span className="rounded-sm border border-yellow/30 bg-yellow/10 px-1.5 py-0.2 font-mono text-[0.62rem] font-bold text-yellow">
                              Meio a Meio
                            </span>
                          )}
                        </div>

                        {/* Crust info */}
                        {item.crust && (
                          <div className="mt-1.5 flex items-center gap-1 text-[0.68rem] text-yellow">
                            <Sparkles className="size-3 shrink-0" />
                            <span>
                              {item.crust.name} (+ R${" "}
                              {formatPrice(item.crust.price)})
                            </span>
                          </div>
                        )}

                        {/* Extras */}
                        {item.extras && item.extras.length > 0 && (
                          <p className="mt-1 text-[0.65rem] text-cream-dim">
                            <strong className="text-yellow font-medium">
                              Adicionais:
                            </strong>{" "}
                            {item.extras
                              .map(
                                (e) => `${e.name} (+R$ ${formatPrice(e.price)})`
                              )
                              .join(", ")}
                          </p>
                        )}

                        {/* Removals */}
                        {item.removals && item.removals.length > 0 && (
                          <p className="mt-0.5 text-[0.65rem] text-red-300">
                            <strong>Remoções:</strong>{" "}
                            {item.removals.join(", ")}
                          </p>
                        )}

                        {/* Observation */}
                        {item.observation && (
                          <p className="mt-1.5 text-[0.68rem] italic text-muted/80 bg-black/30 rounded-sm px-2 py-1 border border-white/5">
                            Obs: &ldquo;{item.observation}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <span className="font-mono text-sm font-bold text-yellow sm:text-base">
                        R$ {formatPrice(item.price * item.qty)}
                      </span>
                    </div>

                    {/* Stepper Footer */}
                    <div className="flex items-center justify-between border-t border-white/6 pt-2.5">
                      <span className="text-[0.68rem] text-muted font-mono">
                        R$ {formatPrice(item.price)} un.
                      </span>

                      <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-black/60 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.qty === 1) {
                              onRemove(item.id);
                            } else {
                              onUpdateQty(item.id, -1);
                            }
                          }}
                          className="flex size-7 cursor-pointer items-center justify-center rounded-sm text-cream-dim transition-colors hover:bg-white/10 hover:text-red-light"
                          aria-label={
                            item.qty === 1 ? "Remover item" : "Diminuir"
                          }
                        >
                          {item.qty === 1 ? (
                            <Trash2 className="size-3.5" />
                          ) : (
                            <Minus className="size-3.5" />
                          )}
                        </button>

                        <span className="min-w-5 text-center font-mono text-xs font-bold text-cream">
                          {item.qty}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="flex size-7 cursor-pointer items-center justify-center rounded-sm text-cream-dim transition-colors hover:bg-white/10 hover:text-yellow"
                          aria-label="Aumentar"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Cross-selling: Quick Drink up-sell tip if no drinks added */}
          {cart.length > 0 && !hasDrink && onAddDrink && (
            <div className="rounded-sm border border-yellow/20 bg-linear-to-r from-yellow/10 via-yellow/5 to-transparent p-3.5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Wine className="size-5 text-yellow shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-cream">
                    Quer acompanhar com uma bebida bem gelada?
                  </p>
                  <p className="text-[0.68rem] text-muted">
                    Adicione com apenas 1 clique:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quickDrinks.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => onAddDrink(d)}
                    className="flex items-center justify-between p-2 rounded-sm border border-yellow/30 bg-black/40 hover:bg-yellow/15 text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <span className="block text-xs font-bold text-cream truncate">
                        {d.name}
                      </span>
                      <span className="block font-mono text-[0.65rem] text-yellow">
                        R$ {formatPrice(d.price)}
                      </span>
                    </div>
                    <Plus className="size-4 text-yellow shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {cart.length > 0 && (
          <div className="shrink-0 border-t border-yellow/20 bg-linear-to-b from-[#1a1718] to-[#121011] p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Subtotal dos itens</span>
                <span className="font-mono text-cream font-medium">
                  R$ {formatPrice(total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Entrega ou Retirada</span>
                <span className="text-yellow text-[0.68rem]">
                  Escolha na próxima etapa
                </span>
              </div>
              <div className="flex items-end justify-between border-t border-white/6 pt-2">
                <span className="font-body text-base font-bold text-cream">
                  Total
                </span>
                <span className="font-display text-2xl font-bold text-yellow sm:text-3xl">
                  R$ {formatPrice(total)}
                </span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-sm bg-linear-to-r from-red-dark via-red-primary to-yellow px-5 py-4 font-body text-sm font-bold text-cream shadow-[0_8px_24px_rgba(217,4,22,0.35)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              <span>Avançar para Pagamento & Entrega</span>
              <ArrowRight className="size-4.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
