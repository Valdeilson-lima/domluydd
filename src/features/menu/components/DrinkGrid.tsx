"use client";

import { DrinkCard } from "@/features/menu/components/DrinkCard";
import type { Drink } from "@/types";

interface DrinkGridProps {
  drinks: Drink[];
  isPaused: (name: string) => boolean;
  onAdd: (drink: Drink) => void;
}

export function DrinkGrid({ drinks, isPaused, onAdd }: DrinkGridProps) {
  if (drinks.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="font-serif text-2xl font-normal text-foreground sm:text-3xl">
            Bebidas geladas
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Refrigerantes clássicos e Cajuína regional para acompanhar.
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {drinks.length} {drinks.length === 1 ? "bebida" : "bebidas"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {drinks.map((drink) => (
          <DrinkCard
            key={drink.id}
            drink={drink}
            paused={isPaused(drink.name) || drink.available === false}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  );
}
