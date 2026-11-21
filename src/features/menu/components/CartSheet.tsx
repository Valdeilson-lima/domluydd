"use client";

import { useState } from "react";
import { Trash2, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogDrawerContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  subtotal: number;
  onUpdateQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function CartSheet({
  open,
  onOpenChange,
  cart,
  subtotal,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
}: CartSheetProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmingClear(false);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogDrawerContent>
        <div className="border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle>Sua sacola</DialogTitle>
            <DialogDescription>
              Revise sabores, bordas e quantidades antes de enviar para o forno.
            </DialogDescription>
          </DialogHeader>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <span
              className="flex size-12 items-center justify-center border border-border bg-card text-muted-foreground"
              aria-hidden="true"
            >
              <ShoppingBag className="size-5" />
            </span>
            <p className="font-serif text-xl text-foreground">
              Sua sacola está vazia
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Escolha pizzas inteiras, meio a meio, combos ou bebidas geladas no
              cardápio para começar.
            </p>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="mt-2 inline-flex min-h-11 items-center border border-foreground bg-secondary px-5 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              style={{ borderRadius: "2px" }}
            >
              Explorar sabores
            </button>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-6 py-5">
            {cart.map((item, idx) => (
              <div
                key={item.id}
                className="space-y-2.5 border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-serif text-base leading-snug text-foreground">
                      {item.flavors.map((f) => f.name).join(" + ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tamanho {item.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="flex size-11 -mr-2 -mt-2 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={`Remover ${item.flavors.map((f) => f.name).join(" + ")} da sacola`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>

                {item.crust && (
                  <p className="text-xs text-muted-foreground">
                    Borda: {item.crust.name} (+R${" "}
                    {formatPrice(item.crust.price)})
                  </p>
                )}
                {item.extras && item.extras.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Extras: {item.extras.map((e) => e.name).join(", ")}
                  </p>
                )}
                {item.removals && item.removals.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Retirar: {item.removals.join(", ")}
                  </p>
                )}
                {item.observation && (
                  <p className="text-xs text-muted-foreground">
                    Obs.: {item.observation}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center border border-border bg-background">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(idx, -1)}
                      className="flex size-10 items-center justify-center text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                      aria-label={`Diminuir quantidade de ${item.flavors.map((f) => f.name).join(" + ")}`}
                    >
                      −
                    </button>
                    <span className="w-9 text-center font-mono text-xs font-semibold tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(idx, 1)}
                      className="flex size-10 items-center justify-center text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                      aria-label={`Aumentar quantidade de ${item.flavors.map((f) => f.name).join(" + ")}`}
                    >
                      +
                    </button>
                  </div>

                  <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
                    R$ {formatPrice(item.price * item.qty)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="space-y-3 border-t border-border bg-background px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                Subtotal (taxa calculada na entrega)
              </span>
              <span className="font-mono text-lg font-semibold text-foreground tabular-nums">
                R$ {formatPrice(subtotal)}
              </span>
            </div>

            {confirmingClear ? (
              <div className="flex items-center justify-between gap-2 border border-foreground bg-secondary p-2.5 text-xs">
                <span className="font-semibold text-foreground">
                  Esvaziar toda a sacola?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(false)}
                    className="min-h-9 border border-border bg-background px-3 font-semibold text-foreground"
                    style={{ borderRadius: "2px" }}
                  >
                    Manter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClear();
                      setConfirmingClear(false);
                    }}
                    className="min-h-9 bg-primary px-3 font-semibold text-primary-foreground"
                    style={{ borderRadius: "2px" }}
                  >
                    Sim, limpar
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="min-h-11 border border-border bg-secondary px-4 text-xs font-semibold text-foreground transition-colors hover:border-foreground hover:bg-background"
                style={{ borderRadius: "2px" }}
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={onCheckout}
                className="min-h-11 flex-1 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.985]"
                style={{ borderRadius: "2px" }}
              >
                Continuar para entrega
              </button>
            </div>
          </div>
        )}
      </DialogDrawerContent>
    </Dialog>
  );
}
