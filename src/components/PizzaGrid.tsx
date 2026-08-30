import type { Pizza } from "@/types";
import { PizzaCard } from "./PizzaCard";
import { SearchX } from "lucide-react";

interface PizzaGridProps {
  pizzas: Pizza[];
  onSelect: (id: string) => void;
}

export function PizzaGrid({ pizzas, onSelect }: PizzaGridProps) {
  if (pizzas.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-white/10 bg-white/2 px-5 py-14 text-center">
        <SearchX className="mx-auto mb-3 size-9 text-muted/40" />
        <p className="font-body text-base font-semibold text-cream-dim">
          Nada encontrado por aqui
        </p>
        <p className="mt-1 text-xs text-muted">
          Tente outro nome ou troque de aba
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
      {pizzas.map((pizza, i) => (
        <PizzaCard key={pizza.id} pizza={pizza} index={i} onSelect={onSelect} />
      ))}
    </ul>
  );
}
