"use client";

import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CartBarProps {
  totalQty: number;
  subtotal: number;
  onOpenCart: () => void;
}

export function CartBar({ totalQty, subtotal, onOpenCart }: CartBarProps) {
  if (totalQty <= 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden">
      <button
        type="button"
        onClick={onOpenCart}
        className="flex min-h-12 w-full items-center justify-between bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-150 active:scale-[0.985]"
        style={{ borderRadius: "2px" }}
      >
        <span className="flex items-center gap-2">
          <ShoppingBag className="size-4" aria-hidden="true" />
          Ver sacola ({totalQty} {totalQty === 1 ? "item" : "itens"})
        </span>
        <span className="font-mono tabular-nums">
          R$ {formatPrice(subtotal)}
        </span>
      </button>
    </div>
  );
}
