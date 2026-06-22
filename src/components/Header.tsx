import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "salgadas", label: "Salgadas", count: 32 },
  { id: "doces", label: "Doces", count: 6 },
  { id: "bebidas", label: "Bebidas", count: 4 },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-200 border-b border-yellow/25 bg-linear-to-b from-[#591212] to-[#2a1010] backdrop-blur-md shadow-[0_4px_24px_rgba(89,18,18,0.25)]">
      <div className="mx-auto flex h-14 max-w-280 items-center justify-between gap-2.5 px-3 sm:h-16 sm:px-5">
        <div className="flex shrink-0 items-center gap-2.5 pr-2">
          <img
            src="/logo.png"
            alt="Don Luydd Pizzaria"
            className="h-9 w-auto rounded-full ring-1 ring-yellow/30 sm:h-10"
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
                  "group relative shrink-0 cursor-pointer whitespace-nowrap px-2 py-1.5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 select-none sm:px-3.5 sm:py-2 sm:text-[0.72rem] max-sm:w-full max-sm:py-3 max-sm:text-sm max-sm:tracking-[0.1em]",
                  active ? "text-yellow" : "text-muted hover:text-cream-dim"
                )}
              >
                <span className="flex items-baseline gap-1.5">
                  {tab.label}
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

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/5 text-cream transition-colors duration-200 hover:bg-white/10 active:scale-90 sm:hidden"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
