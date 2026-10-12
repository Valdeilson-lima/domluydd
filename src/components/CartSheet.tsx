import {
  X,
  ShoppingBag,
  Pizza,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Wine,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";
import { useEffect, useRef } from "react";

interface CartSheetProps {
  open: boolean;
  cart: CartItem[];
  total: number;
  itemCount: number;
  onClose: () => void;
  onRemove: (id: number) => void;
  onUpdateQty: (id: number, delta: number) => void;
  onCheckout: () => void;
  onAddDrink?: (name: string, price: number) => void;
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
}: CartSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) sheetRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const hasDrink = cart.some((item) => item.category === "Bebida");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-350 bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-[fadeIn_0.25s_ease]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        tabIndex={-1}
        className="fixed top-0 right-0 bottom-0 z-351 flex w-full max-w-md flex-col border-l border-yellow/20 bg-linear-to-b from-[#1c191a] to-[#121011] shadow-[-16px_0_48px_rgba(0,0,0,0.7)] animate-[slideInRight_0.35s_cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-yellow/15 text-yellow">
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
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/4 text-muted transition-all duration-200 hover:border-yellow/50 hover:bg-yellow/15 hover:text-yellow active:scale-90"
            aria-label="Fechar carrinho"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white/4 ring-1 ring-white/10">
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
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-yellow/15 px-5 py-2.5 font-mono text-xs font-bold text-yellow transition-all duration-200 hover:bg-yellow/25 active:scale-95"
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
                    className="flex flex-col gap-2.5 rounded-2xl border border-white/8 bg-white/2 p-3.5 shadow-sm transition-all duration-200 hover:border-white/15"
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
                          <span className="rounded-md border border-white/10 bg-white/4 px-1.5 py-0.2 font-mono text-[0.62rem] font-bold text-cream-dim">
                            {isDrink ? "Bebida" : `Tamanho ${item.size}`}
                          </span>

                          {isHalf && (
                            <span className="rounded-md border border-yellow/30 bg-yellow/10 px-1.5 py-0.2 font-mono text-[0.62rem] font-bold text-yellow">
                              Meio a Meio
                            </span>
                          )}
                        </div>

                        {/* Observation */}
                        {item.observation && (
                          <p className="mt-1.5 text-[0.68rem] italic text-muted/80 bg-black/30 rounded-md px-2 py-1 border border-white/5">
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

                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.qty === 1) {
                              onRemove(item.id);
                            } else {
                              onUpdateQty(item.id, -1);
                            }
                          }}
                          className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-cream-dim transition-colors hover:bg-white/10 hover:text-red-light"
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
                          className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-cream-dim transition-colors hover:bg-white/10 hover:text-yellow"
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

          {/* Quick Drink up-sell tip if no drinks added */}
          {cart.length > 0 && !hasDrink && (
            <div className="rounded-2xl border border-yellow/20 bg-linear-to-r from-yellow/10 via-yellow/5 to-transparent p-3.5">
              <div className="flex items-center gap-2.5">
                <Wine className="size-5 text-yellow shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-cream">
                    Quer acompanhar com uma bebida bem gelada?
                  </p>
                  <p className="text-[0.68rem] text-muted">
                    Temos Coca-Cola, Guaraná, Fanta e Cajuína na aba Bebidas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        {cart.length > 0 && (
          <div className="shrink-0 border-t border-yellow/20 bg-linear-to-b from-[#1a1718] to-[#121011] p-5 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Subtotal dos itens</span>
                <span className="font-mono text-cream font-medium">
                  R$ {formatPrice(total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Taxa de entrega</span>
                <span className="text-yellow text-[0.68rem]">
                  Calculada na próxima etapa
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
              className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-linear-to-r from-red-dark via-red-primary to-yellow px-5 py-4 font-body text-sm font-bold text-cream shadow-[0_8px_24px_rgba(217,4,22,0.35)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              <span>Avançar para Entrega</span>
              <ArrowRight className="size-4.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
