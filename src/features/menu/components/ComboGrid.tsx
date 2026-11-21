"use client";

import { ComboCard } from "@/features/menu/components/ComboCard";
import type { Combo } from "@/types";

interface ComboGridProps {
  combos: Combo[];
  isPaused: (name: string) => boolean;
  onAdd: (combo: Combo) => void;
}

export function ComboGrid({ combos, isPaused, onAdd }: ComboGridProps) {
  if (combos.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="font-serif text-2xl font-extrabold text-foreground sm:text-3xl">
            Combos da casa
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Combinações com preço fechado, escolha de sabores e refrigerante
            incluso.
          </p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
          {combos.length} {combos.length === 1 ? "combo" : "combos"}
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {combos.map((combo) => (
          <ComboCard
            key={combo.id}
            combo={combo}
            paused={isPaused(combo.name) || combo.available === false}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  );
}
