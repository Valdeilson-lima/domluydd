import type { Drink } from "@/types";
import { DrinkCard } from "./DrinkCard";

interface DrinkGridProps {
  drinks: Drink[];
  onSelect: (drink: Drink) => void;
}

export function DrinkGrid({ drinks, onSelect }: DrinkGridProps) {
  if (drinks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-white/10 bg-white/2 px-5 py-12 text-center">
        <p className="font-body text-base font-semibold text-cream-dim">
          Nenhuma bebida encontrada
        </p>
        <p className="mt-1 text-xs text-muted">Tente outro nome</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-3.5">
      {drinks.map((drink, i) => (
        <DrinkCard
          key={drink.name}
          drink={drink}
          index={i}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
