"use client";

import Link from "next/link";
import { ShoppingBag, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { STORE_SHORT_NAME } from "@/lib/store-config";
import { formatPrice } from "@/lib/utils";

interface MenuHeaderProps {
  totalQty: number;
  subtotal: number;
  onOpenCart: () => void;
  backHref?: string;
  backLabel?: string;
  alwaysShowBackLabel?: boolean;
}

export function MenuHeader({
  totalQty,
  subtotal,
  onOpenCart,
  backHref = "/",
  backLabel = "Início",
  alwaysShowBackLabel = false,
}: MenuHeaderProps) {
  const { isOpen, nextLabel, loading } = useStoreStatus();

  const openLabel = /^aberto/i.test(nextLabel)
    ? nextLabel
    : `Aberto: ${nextLabel}`;
  const closedLabel = /^fechado/i.test(nextLabel)
    ? nextLabel
    : `Fechado: ${nextLabel}`;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={backHref}
            className={
              alwaysShowBackLabel
                ? "inline-flex min-h-11 shrink-0 items-center gap-1.5 border border-border bg-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground sm:px-3 sm:text-sm"
                : "inline-flex min-h-11 shrink-0 items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            }
            style={alwaysShowBackLabel ? { borderRadius: "2px" } : undefined}
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
          <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
          <Link
            href="/cardapio"
            translate="no"
            className="flex min-w-0 items-center gap-2 truncate font-serif text-lg font-medium tracking-tight text-foreground sm:gap-2.5 sm:text-xl"
          >
            <span
              className="inline-block size-3.5 shrink-0 rounded-full border-2 border-primary"
              aria-hidden="true"
            />
            <span className="truncate">{STORE_SHORT_NAME}</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="hidden items-center gap-1.5 border border-border bg-card px-2.5 py-1.5 text-xs font-medium md:inline-flex"
            style={{ borderRadius: "2px" }}
          >
            {loading ? (
              <>
                <Clock
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">
                  Ter–Dom, 18h às 22h
                </span>
              </>
            ) : isOpen ? (
              <>
                <CheckCircle2
                  className="size-3.5 shrink-0 text-status-open"
                  aria-hidden="true"
                />
                <span className="font-semibold text-status-open">
                  {openLabel}
                </span>
              </>
            ) : (
              <>
                <Clock
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{closedLabel}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-11 items-center gap-2.5 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]"
            style={{ borderRadius: "2px" }}
            aria-label={
              totalQty > 0
                ? `Abrir sacola com ${totalQty} ${totalQty === 1 ? "item" : "itens"}, subtotal R$ ${formatPrice(subtotal)}`
                : "Abrir sacola vazia"
            }
          >
            <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">Sacola ({totalQty})</span>
            {totalQty > 0 && (
              <span className="hidden border-l border-primary-foreground/30 pl-2.5 font-mono text-xs tabular-nums sm:inline">
                R$ {formatPrice(subtotal)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
