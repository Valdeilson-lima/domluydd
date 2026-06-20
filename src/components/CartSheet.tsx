import { X, ShoppingBag, Pizza, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";
import { useEffect, useRef } from "react";

interface CartSheetProps {
  open: boolean;
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
}

export function CartSheet({
  open,
  cart,
  total,
  onClose,
  onRemove,
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

  return (
    <>
      <div
        className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
        tabIndex={-1}
        className="fixed bottom-0 left-0 right-0 z-[351] flex max-h-[85vh] flex-col rounded-t-[20px] bg-black-light shadow-[-8px_0_40px_rgba(0,0,0,0.5)] border-t border-white/6 animate-[slideUpPanel_0.35s_cubic-bezier(0.22,1,0.36,1)]"
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 py-3">
          <h3 className="font-display text-base font-bold flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Seu pedido
            {cart.length > 0 && (
              <span className="rounded-full bg-red-primary px-2 py-0.5 font-mono text-[0.65rem] font-bold text-white">
                {cart.length}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/8 text-muted transition-all duration-200 hover:bg-red-primary hover:text-white"
            aria-label="Fechar carrinho"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {cart.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted">
              <Pizza className="mx-auto mb-3 size-10 opacity-40" />
              <p className="mb-1 text-base font-semibold">Carrinho vazio</p>
              <span className="text-xs">Escolha suas pizzas no cardápio</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cart.map((item, idx) => {
                const isHalf =
                  item.flavors.length > 1 &&
                  item.flavors[0].name !== item.flavors[1].name;
                const flavorStr = isHalf
                  ? item.flavors.map((f) => f.name).join(" + ")
                  : item.flavors[0].name;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-[12px] border border-white/6 bg-white/5 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold leading-tight text-white">
                        {flavorStr}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[0.7rem] text-muted">
                        <span>Tam. {item.size}</span>
                        <span>&middot;</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold text-yellow">
                      R$ {formatPrice(item.price)}
                    </span>
                    <button
                      onClick={() => onRemove(idx)}
                      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-muted transition-all duration-200 hover:bg-red-primary/20 hover:text-red-light"
                      aria-label="Remover item"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="shrink-0 border-t border-white/8 px-5 py-4 pb-6">
            <div className="mb-1 flex items-center justify-between text-base font-bold">
              <span>Subtotal</span>
              <span className="font-mono text-[1.2rem] text-yellow-light">
                R$ {formatPrice(total)}
              </span>
            </div>
            <div className="mb-3 flex items-center justify-between rounded-[10px] border border-yellow/20 bg-yellow/8 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-yellow">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-3.5"
                >
                  <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Frete
              </span>
              <span className="font-mono text-[0.75rem] font-semibold text-yellow">
                calculado no fechamento
              </span>
            </div>
            <div className="mb-2 flex gap-2">
              <button
                onClick={onClose}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] border-2 border-white/10 bg-transparent px-4 py-3 font-body text-sm font-bold text-white transition-all duration-200 hover:border-white/30 active:scale-[0.98]"
              >
                + Adicionar mais
              </button>
              <button
                onClick={onCheckout}
                className="flex flex-[2] cursor-pointer items-center justify-center gap-2.5 rounded-[12px] bg-[#25d366] px-4 py-3 font-body text-sm font-bold text-white transition-all duration-200 hover:bg-[#1da851] active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Finalizar pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
