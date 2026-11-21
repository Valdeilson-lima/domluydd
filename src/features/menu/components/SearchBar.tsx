"use client";

import { Search, X } from "lucide-react";

export type CatalogSectionTab = "salgada" | "doce" | "combo" | "bebida" | "all";

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeTab: CatalogSectionTab;
  onTabChange: (tab: CatalogSectionTab) => void;
  activeTag: string;
  onTagChange: (tag: string) => void;
  availableTags: string[];
  totalResults: number;
  counts: Record<CatalogSectionTab, number>;
}

const TABS: Array<{ id: CatalogSectionTab; label: string }> = [
  { id: "all", label: "Tudo" },
  { id: "salgada", label: "Salgadas" },
  { id: "doce", label: "Doces" },
  { id: "combo", label: "Combos" },
  { id: "bebida", label: "Bebidas" },
];

export function SearchBar({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  activeTag,
  onTagChange,
  availableTags,
  totalResults,
  counts,
}: SearchBarProps) {
  return (
    <section
      aria-label="Busca e categorias do cardápio"
      className="sticky top-16 z-20 border-b border-border bg-background/95 py-4 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-6xl space-y-3 px-4 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="catalog-search" className="sr-only">
              Buscar sabores, combos ou ingredientes
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              name="q"
              type="search"
              autoComplete="off"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar sabor, ingrediente ou combo…"
              className="min-h-11 w-full border border-input bg-card pl-10 pr-11 text-base text-foreground placeholder:text-muted-foreground sm:text-sm"
              style={{ borderRadius: "2px" }}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-0.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="Categorias do cardápio"
          >
            {TABS.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onTabChange(tab.id)}
                  className={`inline-flex min-h-11 items-center gap-1.5 px-3.5 text-xs font-semibold uppercase tracking-wider transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] sm:min-h-10 ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground hover:bg-secondary"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      selected ? "opacity-85" : "text-muted-foreground"
                    }`}
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {availableTags.length > 0 ? (
            <div className="flex flex-wrap gap-2" aria-label="Subfiltros">
              {["Todas", ...availableTags].map((tag) => {
                const selected = activeTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onTagChange(tag)}
                    className={`min-h-9 border px-3 text-xs font-medium transition-[background-color,color,border-color] duration-150 ${
                      selected
                        ? "border-foreground bg-secondary font-semibold text-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                    }`}
                    style={{ borderRadius: "2px" }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          ) : (
            <span />
          )}

          <p
            className="font-mono text-xs font-medium text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {totalResults}{" "}
            {totalResults === 1 ? "item exibido" : "itens exibidos"}
          </p>
        </div>
      </div>
    </section>
  );
}
