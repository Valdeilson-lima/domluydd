"use client";

import { PizzaCard } from "@/features/menu/components/PizzaCard";
import type { Pizza } from "@/types";

interface PizzaGridProps {
  title: string;
  subtitle?: string;
  pizzas: Pizza[];
  isPaused: (name: string) => boolean;
  onSelect: (pizza: Pizza) => void;
}

export function PizzaGrid({
  title,
  subtitle,
  pizzas,
  isPaused,
  onSelect,
}: PizzaGridProps) {
  if (pizzas.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="font-serif text-2xl font-normal text-foreground sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {pizzas.length} {pizzas.length === 1 ? "sabor" : "sabores"}
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pizzas.map((pizza) => (
          <PizzaCard
            key={pizza.id}
            pizza={pizza}
            paused={isPaused(pizza.name)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
