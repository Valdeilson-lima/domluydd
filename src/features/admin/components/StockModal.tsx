"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizeText } from "@/lib/utils";
import type { CatalogSnapshot } from "@/types";

interface StockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog?: CatalogSnapshot;
  isPaused: (name: string) => boolean;
  onToggleStock: (name: string, available: boolean) => Promise<void>;
}

export function StockModal({
  open,
  onOpenChange,
  catalog,
  isPaused,
  onToggleStock,
}: StockModalProps) {
  const [query, setQuery] = useState("");
  const [busyName, setBusyName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const catalogItems = useMemo(() => {
    const pizzasSource = catalog?.pizzas ?? [];
    const combosSource = catalog?.combos ?? [];
    const drinksSource = catalog?.drinks ?? [];
    const list = [
      ...pizzasSource.map((p) => ({
        id: p.id,
        name: p.name,
        group: p.category === "doce" ? "Pizza doce" : "Pizza salgada",
      })),
      ...combosSource.map((c) => ({ id: c.id, name: c.name, group: "Combo" })),
      ...drinksSource.map((d) => ({ id: d.id, name: d.name, group: "Bebida" })),
    ];

    const q = normalizeText(query);
    if (!q) return list;
    return list.filter((it) => normalizeText(it.name).includes(q));
  }, [catalog, query]);

  const handleToggle = async (name: string, currentlyPaused: boolean) => {
    setBusyName(name);
    setError(null);
    try {
      await onToggleStock(name, currentlyPaused);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar disponibilidade."
      );
    } finally {
      setBusyName(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-xl flex-col">
        <DialogHeader>
          <DialogTitle>Disponibilidade de sabores e bebidas</DialogTitle>
          <DialogDescription>
            Itens pausados ficam indisponíveis no cardápio e no seletor meio a
            meio imediatamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label htmlFor="stock-search" className="sr-only">
            Filtrar item do estoque
          </label>
          <input
            id="stock-search"
            name="stockSearch"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: Marguerita, combo ou bebida…"
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-base text-foreground sm:text-sm"
          />
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
            >
              {error}
            </p>
          )}
        </div>

        <ul className="mt-3 flex-1 divide-y divide-border overflow-y-auto rounded-xl border border-border bg-card">
          {catalogItems.map((item) => {
            const paused = isPaused(item.name);
            const busy = busyName === item.name;
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-bold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.group}</p>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggle(item.name, paused)}
                  className={`min-h-10 rounded-xl border px-3.5 text-xs font-bold transition-colors ${
                    paused
                      ? "border-primary bg-primary text-primary-foreground hover:bg-primary-hover"
                      : "border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {busy ? "Salvando…" : paused ? "Retomar" : "Pausar"}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
