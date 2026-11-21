"use client";

import { CupSoda } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Drink } from "@/types";

interface DrinkCardProps {
  drink: Drink;
  paused: boolean;
  onAdd: (drink: Drink) => void;
}

export function DrinkCard({ drink, paused, onAdd }: DrinkCardProps) {
  return (
    <article className="flex items-center justify-between gap-4 border border-border bg-card p-4 transition-colors duration-150 hover:border-foreground/50">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-border bg-background text-foreground"
          aria-hidden="true"
        >
          <CupSoda className="size-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-medium text-foreground">
              {drink.name}
            </h3>
            {paused && (
              <span className="border border-border bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                Pausada
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{drink.desc}</p>
          <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
            R$ {formatPrice(drink.price)}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={paused}
        onClick={() => onAdd(drink)}
        className="min-h-11 shrink-0 bg-primary px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        style={{ borderRadius: "2px" }}
      >
        {paused ? "Indisponível" : "Adicionar"}
      </button>
    </article>
  );
}
