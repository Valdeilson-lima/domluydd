import type { Pizza } from "@/types";
import { PizzaCard } from "./PizzaCard";

interface PizzaGridProps {
  pizzas: Pizza[];
  onSelect: (id: string) => void;
}

export function PizzaGrid({ pizzas, onSelect }: PizzaGridProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {pizzas.map((pizza) => (
        <PizzaCard key={pizza.id} pizza={pizza} onSelect={onSelect} />
      ))}
    </div>
  );
}
