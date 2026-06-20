import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "salgadas", label: "Salgadas" },
  { id: "doces", label: "Doces" },
  { id: "bebidas", label: "Bebidas" },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-200 bg-linear-to-br from-red-dark via-red-primary to-red-light shadow-lg border-b-3 border-yellow">
      <div className="mx-auto flex h-14 max-w-280 items-center justify-between gap-2.5 px-3 sm:h-16 sm:px-4">
        <div className="flex shrink-0 items-center gap-2 pr-3 relative after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-5 after:w-px after:bg-white/15 ">
          <img
            src="/logo.png"
            alt="Don Luydd Pizzaria"
            className="h-9 w-auto rounded-full sm:h-10"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-extrabold uppercase tracking-[0.5px] text-white sm:text-sm">
              Don Luydd
            </span>
            <span className="text-[0.5rem] font-bold uppercase tracking-[2px] text-black sm:text-xs">
              Pizzaria Artesanal
            </span>
          </div>
        </div>

        <nav
          className={cn(
            "flex gap-1 overflow-x-auto flex-nowrap scrollbar-none max-sm:absolute max-sm:top-full max-sm:left-0 max-sm:right-0 max-sm:flex-col max-sm:gap-0 max-sm:bg-linear-to-br max-sm:from-red-dark max-sm:via-red-primary max-sm:to-red-light max-sm:px-2.5 max-sm:pb-3 max-sm:pt-2 max-sm:shadow-lg max-sm:border-t max-sm:border-white/10 max-sm:z-199 max-sm:transition-all max-sm:duration-250",
            menuOpen
              ? "max-sm:flex max-sm:opacity-100 max-sm:translate-y-0 max-sm:pointer-events-auto"
              : "max-sm:hidden max-sm:opacity-0 max-sm:-translate-y-2 max-sm:pointer-events-none"
          )}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                setMenuOpen(false);
              }}
              className={cn(
                "shrink-0 cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 select-none sm:px-4.5 sm:py-2 sm:text-[0.82rem] max-sm:w-full max-sm:justify-start max-sm:rounded-sm max-sm:py-3 max-sm:text-sm",
                activeTab === tab.id
                  ? "bg-yellow text-black max-sm:bg-white/15 max-sm:text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-black/20 text-white transition-colors duration-200 hover:bg-white/15 active:scale-90 sm:hidden"
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
