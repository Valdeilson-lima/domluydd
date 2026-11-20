"use client";

import { formatPrice } from "@/lib/utils";
import type { Drink } from "@/types";

interface DrinkCardProps {
  drink: Drink;
  paused: boolean;
  onAdd: (drink: Drink) => void;
}

export function DrinkCard({ drink, paused, onAdd }: DrinkCardProps) {
  return (
    <article className="dluydd-card flex items-center justify-between gap-4 border border-border bg-card p-4">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-lg font-normal text-foreground">
            {drink.name}
          </h3>
          {paused && (
            <span className="border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pausada
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{drink.desc}</p>
        <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
          R$ {formatPrice(drink.price)}
        </p>
      </div>

      <button
        type="button"
        disabled={paused}
        onClick={() => onAdd(drink)}
        className="h-10 shrink-0 bg-primary px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        style={{ borderRadius: "2px" }}
      >
        {paused ? "Indisponível" : "Adicionar"}
      </button>
    </article>
  );
}
