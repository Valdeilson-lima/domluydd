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
}: SearchBarProps) {
  return (
    <section
      aria-label="Filtros do cardápio"
      className="border-b border-border bg-background py-5"
    >
      <div className="mx-auto max-w-6xl space-y-4 px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="catalog-search" className="sr-only">
              Buscar sabores, combos ou ingredientes
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ex.: Marguerita, queijo ou combo…"
              className="h-11 w-full border border-input bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              style={{ borderRadius: "2px" }}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="text-xs font-medium text-muted-foreground">
            {totalResults}{" "}
            {totalResults === 1 ? "item exibido" : "itens exibidos"}
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Categorias"
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
                className={`h-9 px-4 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground hover:bg-secondary"
                }`}
                style={{ borderRadius: "2px" }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {["Todas", ...availableTags].map((tag) => {
              const selected = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagChange(tag)}
                  className={`h-8 px-3 text-xs font-medium transition-colors ${
                    selected
                      ? "border border-foreground bg-secondary font-semibold text-foreground"
                      : "border border-border bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
