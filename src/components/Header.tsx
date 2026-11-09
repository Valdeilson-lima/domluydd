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
  storeOpen?: boolean;
  storeLabel?: string;
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
  storeOpen,
  storeLabel,
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
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[0.95rem] font-semibold italic leading-none tracking-[-0.01em] text-cream [font-variation-settings:'opsz'_36,'SOFT'_30] sm:text-base">
                Don Luydd
              </span>
              {typeof storeOpen === "boolean" && (
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-sm px-1.5 py-0.2 font-mono text-[0.55rem] font-bold border",
                    storeOpen
                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                      : "border-red-500/40 bg-red-950/40 text-red-300"
                  )}
                  title={storeLabel || (storeOpen ? "Aberto" : "Fechado")}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      storeOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                    )}
                  />
                  <span>{storeOpen ? "Aberto" : "Fechado"}</span>
                </span>
              )}
            </div>
            <span className="mt-0.5 font-mono text-[0.5rem] font-semibold uppercase tracking-[0.18em] text-yellow/80 sm:text-[0.55rem]">
              Pizzaria
            </span>
          </div>
        </div>

        {/* Desktop Category Navigation */}
        <nav
          aria-label="Categorias desktop"
          className="hidden sm:flex gap-1 overflow-x-auto flex-nowrap scrollbar-none"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative shrink-0 cursor-pointer whitespace-nowrap px-3 py-2 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 select-none flex items-center justify-between",
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
                  <span className="text-[0.6rem] font-normal tracking-normal text-muted/60">
                    {tab.count}
                  </span>
                </span>
                <span
                  className={cn(
                    "absolute -bottom-px left-0 h-0.5 bg-yellow transition-all duration-300",
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

      {/* Mobile Drawer when Menu button is clicked */}
      {menuOpen && (
        <div className="border-t border-yellow/20 bg-linear-to-b from-[#2a1010] to-[#1a1213] px-4 py-3 sm:hidden animate-[fadeUp_0.2s_ease] space-y-2.5">
          {hasLastOrder && onRepeatLastOrder && (
            <button
              onClick={() => {
                onRepeatLastOrder();
                setMenuOpen(false);
              }}
              type="button"
              className="flex w-full items-center justify-between rounded-sm border border-yellow/30 bg-yellow/10 px-3.5 py-2.5 text-xs font-bold text-yellow"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="size-4" />
                <span>Repetir Último Pedido</span>
              </div>
              <span className="font-mono text-[0.65rem] opacity-75">
                Recarregar
              </span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-sm border border-white/10 bg-white/4 px-3 py-2.5 text-cream-dim hover:text-cream hover:bg-white/10"
            >
              <span>👨‍🍳 Área do Forno</span>
            </Link>

            <a
              href="https://wa.me/5583993740352"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-sm border border-[#25d366]/30 bg-[#25d366]/10 px-3 py-2.5 text-[#25d366]"
            >
              <span>💬 Falar no WhatsApp</span>
            </a>
          </div>

          <div className="text-[0.68rem] text-muted text-center pt-1 border-t border-white/6 flex items-center justify-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full",
                storeOpen ? "bg-emerald-400" : "bg-red-400"
              )}
            />
            <span>
              {typeof storeOpen === "boolean"
                ? storeOpen
                  ? "🍕 Aberto agora para pedidos!"
                  : `🍕 Don Luydd Pizzaria · ${storeLabel || "Fechado no momento"}`
                : "🍕 Don Luydd Pizzaria · Terça a Domingo, 18h às 22h"}
            </span>
          </div>
        </div>
      )}

      {/* Mobile Horizontal Category Strip (Sticky & Swipeable) */}
      <nav
        aria-label="Categorias do cardápio"
        className="flex sm:hidden overflow-x-auto scrollbar-none border-t border-white/8 bg-black/50 px-2.5 py-1.5 gap-1.5 overscroll-x-contain"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-sm font-mono text-[0.72rem] font-semibold uppercase tracking-wider transition-all cursor-pointer select-none",
                active
                  ? "bg-yellow text-black font-bold shadow-md"
                  : "bg-white/5 text-muted hover:text-cream border border-white/6"
              )}
            >
              <span>{tab.label}</span>
              {tab.isPromo && (
                <span
                  className={cn(
                    "px-1 py-0.2 rounded-sm text-[0.52rem] font-bold tracking-normal",
                    active
                      ? "bg-red-primary text-white"
                      : "bg-red-primary/30 text-red-light"
                  )}
                >
                  Promo
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
