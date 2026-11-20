"use client";

import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col border border-border bg-background text-foreground p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-2xl font-normal text-foreground">
            Sua sacola
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Revise sabores, bordas e quantidades antes de enviar para a cozinha.
          </DialogDescription>
        </DialogHeader>

        {cart.length === 0 ? (
          <div className="my-8 border border-border bg-card p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              Sua sacola está vazia.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Escolha pizzas, combos ou bebidas no cardápio para começar.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {cart.map((item, idx) => (
              <div
                key={item.id}
                className="space-y-2 border border-border bg-card p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-serif text-base text-foreground">
                      {item.flavors.map((f) => f.name).join(" + ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tamanho {item.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                    aria-label={`Remover ${item.flavors.map((f) => f.name).join(" + ")}`}
                  >
                    <Trash2 className="h-4 w-4" />
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
                    Obs.: {item.removals.join(", ")}
                  </p>
                )}
                {item.observation && (
                  <p className="text-xs text-muted-foreground">
                    Nota: {item.observation}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center border border-border bg-background">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(idx, -1)}
                      className="h-8 w-8 text-sm font-bold hover:bg-secondary"
                      aria-label="Diminuir item"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono text-xs font-semibold tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(idx, 1)}
                      className="h-8 w-8 text-sm font-bold hover:bg-secondary"
                      aria-label="Aumentar item"
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
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-mono text-lg font-semibold text-foreground tabular-nums">
                R$ {formatPrice(subtotal)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Limpar todos os itens da sacola?")) {
                    onClear();
                  }
                }}
                className="h-11 border border-border bg-secondary px-4 text-xs font-semibold text-foreground transition-colors hover:bg-background"
                style={{ borderRadius: "2px" }}
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={onCheckout}
                className="h-11 flex-1 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                style={{ borderRadius: "2px" }}
              >
                Finalizar pedido
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
