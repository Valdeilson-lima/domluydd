import type { Pizza } from "@/types";
import { PizzaCard } from "./PizzaCard";

interface PizzaGridProps {
  pizzas: Pizza[];
  onSelect: (id: string) => void;
}

export function PizzaGrid({ pizzas, onSelect }: PizzaGridProps) {
  if (pizzas.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center">
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
    <div className="flex flex-col gap-3 sm:gap-3.5">
      {pizzas.map((pizza, i) => (
        <PizzaCard key={pizza.id} pizza={pizza} index={i} onSelect={onSelect} />
      ))}
    </div>
  );
}
