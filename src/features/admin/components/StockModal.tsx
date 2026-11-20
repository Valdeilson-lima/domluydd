"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { allPizzas } from "@/data/pizzas";
import { combos } from "@/data/combos";
import { bebidas } from "@/data/drinks";
import { normalizeText } from "@/lib/utils";

interface StockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPaused: (name: string) => boolean;
  onToggleStock: (name: string, available: boolean) => Promise<void>;
}

export function StockModal({
  open,
  onOpenChange,
  isPaused,
  onToggleStock,
}: StockModalProps) {
  const [query, setQuery] = useState("");
  const [busyName, setBusyName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const catalogItems = useMemo(() => {
    const list = [
      ...allPizzas.map((p) => ({
        id: p.id,
        name: p.name,
        group: p.category === "doce" ? "Pizza doce" : "Pizza salgada",
      })),
      ...combos.map((c) => ({ id: c.id, name: c.name, group: "Combo" })),
      ...bebidas.map((d) => ({ id: d.id, name: d.name, group: "Bebida" })),
    ];

    const q = normalizeText(query);
    if (!q) return list;
    return list.filter((it) => normalizeText(it.name).includes(q));
  }, [query]);

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
      <DialogContent className="flex max-h-[90vh] max-w-xl flex-col border border-border bg-background text-foreground p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-2xl font-normal text-foreground">
            Disponibilidade de sabores e bebidas
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
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
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: Marguerita, combo ou bebida…"
            className="h-10 w-full border border-input bg-card px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
            style={{ borderRadius: "2px" }}
          />
          {error && (
            <p
              role="alert"
              className="border border-foreground bg-secondary px-3 py-2 text-xs font-semibold"
            >
              {error}
            </p>
          )}
        </div>

        <ul className="mt-3 flex-1 divide-y divide-border overflow-y-auto border border-border bg-card">
          {catalogItems.map((item) => {
            const paused = isPaused(item.name);
            const busy = busyName === item.name;
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.group}</p>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleToggle(item.name, paused)}
                  className={`h-8 border px-3 text-xs font-semibold ${
                    paused
                      ? "border-foreground bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                  style={{ borderRadius: "2px" }}
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
