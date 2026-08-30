import type { Drink } from "@/types";
import { DrinkCard } from "./DrinkCard";
import { GlassWater } from "lucide-react";

interface DrinkGridProps {
  drinks: Drink[];
  onSelect: (drink: Drink) => void;
}

export function DrinkGrid({ drinks, onSelect }: DrinkGridProps) {
  if (drinks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-white/10 bg-white/2 px-5 py-14 text-center">
        <GlassWater className="mx-auto mb-3 size-9 text-muted/40" />
        <p className="font-body text-base font-semibold text-cream-dim">
          Nenhuma bebida encontrada
        </p>
        <p className="mt-1 text-xs text-muted">Tente outro nome</p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
      {drinks.map((drink, i) => (
        <DrinkCard
          key={drink.name}
          drink={drink}
          index={i}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
