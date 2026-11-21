"use client";

import Link from "next/link";
import { ShoppingBag, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { formatPrice } from "@/lib/utils";
import type { StoreStatusData } from "@/types/store";

interface MenuHeaderProps {
  totalQty: number;
  subtotal: number;
  onOpenCart: () => void;
  backHref?: string;
  backLabel?: string;
  alwaysShowBackLabel?: boolean;
  initialStoreStatus?: StoreStatusData;
}

export function MenuHeader({
  totalQty,
  subtotal,
  onOpenCart,
  backHref = "/",
  backLabel = "Início",
  alwaysShowBackLabel = false,
  initialStoreStatus,
}: MenuHeaderProps) {
  const { isOpen, nextLabel, hoursShort, loading } =
    useStoreStatus(initialStoreStatus);

  const openLabel = /^aberto/i.test(nextLabel)
    ? nextLabel
    : `Aberto · ${nextLabel}`;
  const closedLabel = /^fechado/i.test(nextLabel)
    ? nextLabel
    : `Fechado · ${nextLabel}`;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={backHref}
            className={
              alwaysShowBackLabel
                ? "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary sm:text-sm"
                : "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            }
            aria-label={
              backHref === "/cardapio"
                ? "Voltar para o cardápio completo"
                : "Voltar para a página inicial da pizzaria"
            }
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            <span
              className={alwaysShowBackLabel ? "inline" : "hidden sm:inline"}
            >
              {backLabel}
            </span>
          </Link>
          <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
          <Link href="/cardapio" className="group min-w-0">
            <BrandMark size="sm" />
          </Link>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold md:inline-flex ${
              loading
                ? "bg-secondary text-muted-foreground"
                : isOpen
                  ? "bg-status-open/10 text-status-open"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            {loading ? (
              <>
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{hoursShort}</span>
              </>
            ) : isOpen ? (
              <>
                <CheckCircle2
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{openLabel}</span>
              </>
            ) : (
              <>
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{closedLabel}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98]"
            aria-label={
              totalQty > 0
                ? `Abrir sacola com ${totalQty} ${totalQty === 1 ? "item" : "itens"}, subtotal R$ ${formatPrice(subtotal)}`
                : "Abrir sacola vazia"
            }
          >
            <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">Sacola</span>
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent-gold px-1.5 py-0.5 text-xs font-extrabold text-foreground tabular-nums">
              {totalQty}
            </span>
            {totalQty > 0 && (
              <span className="hidden border-l border-white/25 pl-2.5 text-xs font-bold tabular-nums sm:inline">
                R$ {formatPrice(subtotal)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
