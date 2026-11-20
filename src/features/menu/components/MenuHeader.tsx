"use client";

import Link from "next/link";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { STORE_SHORT_NAME } from "@/lib/store-config";
import { formatPrice } from "@/lib/utils";

interface MenuHeaderProps {
  totalQty: number;
  subtotal: number;
  onOpenCart: () => void;
}

export function MenuHeader({
  totalQty,
  subtotal,
  onOpenCart,
}: MenuHeaderProps) {
  const { isOpen, nextLabel, loading } = useStoreStatus();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/"
            className="inline-flex h-11 min-w-11 items-center justify-center gap-2 px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Voltar para a página inicial"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Casa</span>
          </Link>
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <Link
            href="/cardapio"
            className="flex h-11 items-center gap-2.5 font-serif text-xl tracking-tight text-foreground truncate"
          >
            <span
              className="inline-block h-4 w-4 shrink-0 rounded-full border-[3px] border-foreground shadow-[0_0_0_2px_var(--background)]"
              aria-hidden="true"
            />
            {STORE_SHORT_NAME}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <p className="hidden md:block text-xs font-medium text-muted-foreground">
            {loading
              ? "Horário: Ter–Dom, 18h às 22h"
              : isOpen
                ? `Aberto agora · ${nextLabel}`
                : `Fechado · ${nextLabel}`}
          </p>

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex h-11 items-center gap-2.5 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            style={{ borderRadius: "2px" }}
            aria-label={`Abrir sacola com ${totalQty} itens`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span>Sacola ({totalQty})</span>
            {totalQty > 0 && (
              <span className="border-l border-primary-foreground/30 pl-2 font-mono text-xs tabular-nums">
                R$ {formatPrice(subtotal)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
