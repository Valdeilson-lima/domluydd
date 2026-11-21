"use client";

import { CupSoda, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Drink } from "@/types";

interface DrinkCardProps {
  drink: Drink;
  paused: boolean;
  onAdd: (drink: Drink) => void;
}

const DRINK_TONE: Record<string, { bg: string; badge: string }> = {
  coca: {
    bg: "bg-red-50 text-red-700 border-red-200",
    badge: "Cola",
  },
  guarana: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "Guaraná",
  },
  fanta: {
    bg: "bg-orange-50 text-orange-700 border-orange-200",
    badge: "Laranja",
  },
  cajuina: {
    bg: "bg-amber-50 text-amber-800 border-amber-200",
    badge: "Regional",
  },
};

export function DrinkCard({ drink, paused, onAdd }: DrinkCardProps) {
  const tone = DRINK_TONE[drink.icon] ?? {
    bg: "bg-secondary text-foreground border-border",
    badge: "Gelada",
  };

  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-primary/35 hover:shadow-sm">
      <div className="flex min-w-0 items-center gap-3.5">
        {drink.image ? (
          <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
            <img
              src={drink.image}
              alt={drink.name}
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border ${tone.bg}`}
            aria-hidden="true"
          >
            <CupSoda className="size-5" />
          </div>
        )}
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg font-bold text-foreground">
              {drink.name}
            </h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {tone.badge}
            </span>
            {paused && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                Pausada
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {drink.desc}
          </p>
          <p className="pt-0.5 text-sm font-extrabold text-foreground tabular-nums">
            R$ {formatPrice(drink.price)}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={paused}
        onClick={() => onAdd(drink)}
        className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        {paused ? "Pausada" : "Adicionar"}
      </button>
    </article>
  );
}
