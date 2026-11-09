"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ShoppingBag, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { salgadas, doces } from "@/data/pizzas";
import { bebidas } from "@/data/drinks";
import { combos } from "@/data/combos";
import type { PastOrder } from "@/types";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  itemCount?: number;
  onCartOpen?: () => void;
  onRepeatLastOrder?: () => void;
  hasLastOrder?: boolean;
  activeOrder?: PastOrder | null;
}

const tabs = [
  { id: "combos", label: "Combos", count: combos.length, isPromo: true },
  { id: "salgadas", label: "Salgadas", count: salgadas.length },
  { id: "doces", label: "Doces", count: doces.length },
  { id: "bebidas", label: "Bebidas", count: bebidas.length },
];

export function Header({
  activeTab,
  onTabChange,
  itemCount = 0,
  onCartOpen,
  onRepeatLastOrder,
  hasLastOrder = false,
  activeOrder,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-200 border-b border-yellow/25 bg-linear-to-b from-red-dark to-[#2a1010] backdrop-blur-md shadow-[0_4px_24px_rgba(89,18,18,0.25)]">
      <div className="mx-auto flex h-14 max-w-280 items-center justify-between gap-2.5 px-3 sm:h-16 sm:px-5">
        <div className="flex shrink-0 items-center gap-2.5 pr-2">
          <Image
            src="/logo.png"
            alt="Don Luydd Pizzaria"
            width={40}
            height={40}
            className="h-9 w-9 rounded-full ring-1 ring-yellow/30 sm:h-10 sm:w-10 object-cover"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[0.95rem] font-semibold italic leading-none tracking-[-0.01em] text-cream [font-variation-settings:'opsz'_36,'SOFT'_30] sm:text-base">
              Don Luydd
            </span>
            <span className="mt-0.5 font-mono text-[0.5rem] font-semibold uppercase tracking-[0.18em] text-yellow/80 sm:text-[0.55rem]">
              Pizzaria
            </span>
          </div>
        </div>

        <nav
          className={cn(
            "flex gap-1 overflow-x-auto flex-nowrap scrollbar-none max-sm:absolute max-sm:top-full max-sm:left-0 max-sm:right-0 max-sm:flex-col max-sm:gap-0 max-sm:bg-linear-to-b max-sm:from-[#2a1010] max-sm:to-[#1f1c1d] max-sm:px-2.5 max-sm:pb-4 max-sm:pt-2 max-sm:shadow-lg max-sm:border-b max-sm:border-yellow/20 max-sm:z-199 max-sm:transition-all max-sm:duration-250",
            menuOpen
              ? "max-sm:flex max-sm:opacity-100 max-sm:translate-y-0 max-sm:pointer-events-auto"
              : "max-sm:hidden max-sm:opacity-0 max-sm:-translate-y-2 max-sm:pointer-events-none"
          )}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setMenuOpen(false);
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative shrink-0 cursor-pointer whitespace-nowrap px-2 py-1.5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 select-none sm:px-3 sm:py-2 sm:text-[0.72rem] max-sm:w-full max-sm:py-3 max-sm:text-sm max-sm:tracking-widest flex items-center justify-between",
                  active ? "text-yellow" : "text-muted hover:text-cream-dim"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {tab.isPromo && (
                    <span className="rounded-sm bg-red-primary px-1.5 py-0.2 font-mono text-[0.5rem] font-bold text-white uppercase tracking-normal">
                      Promo
                    </span>
                  )}
                  <span className="hidden text-[0.6rem] font-normal tracking-normal text-muted/60 sm:inline">
                    {tab.count}
                  </span>
                </span>
                <span
                  className={cn(
                    "absolute -bottom-px left-0 h-0.5 bg-yellow transition-all duration-300 max-sm:bottom-1.5 max-sm:left-2.5 max-sm:right-2.5",
                    active
                      ? "w-full opacity-100"
                      : "w-0 opacity-0 group-hover:w-full group-hover:opacity-50"
                  )}
                />
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {activeOrder && (
            <Link
              href={`/pedido/${activeOrder.id}`}
              title={`Acompanhar Pedido #${activeOrder.id.slice(0, 8)}`}
              className="flex items-center gap-1.5 rounded-sm border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1.5 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-900/60 active:scale-95 cursor-pointer"
            >
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Meu Pedido</span>
            </Link>
          )}

          {hasLastOrder && onRepeatLastOrder && (
            <button
              onClick={onRepeatLastOrder}
              type="button"
              title="Repetir último pedido"
              className="flex items-center gap-1.5 rounded-sm border border-yellow/30 bg-yellow/10 px-2.5 py-1.5 text-xs font-bold text-yellow transition-all hover:bg-yellow/20 active:scale-95 cursor-pointer max-sm:hidden"
            >
              <RotateCcw className="size-3.5" />
              <span>Repetir Pedido</span>
            </button>
          )}

          {onCartOpen && (
            <button
              onClick={onCartOpen}
              className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/10 bg-white/5 text-cream transition-colors duration-200 hover:bg-white/10 hover:text-yellow active:scale-90"
              aria-label={`Abrir carrinho${itemCount > 0 ? `, ${itemCount} itens` : ""}`}
            >
              <ShoppingBag className="size-4.5" />
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-red-primary font-mono text-[0.6rem] font-bold text-cream ring-2 ring-[#2a1010] animate-[popIn_0.3s_cubic-bezier(0.22,1,0.36,1)]">
                  {itemCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex size-auto shrink-0 cursor-pointer items-center gap-1.5 rounded-sm border border-white/10 bg-white/5 px-2.5 py-2 text-cream transition-colors duration-200 hover:bg-white/10 active:scale-90 sm:hidden"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
              {menuOpen ? "Fechar" : "Menu"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
