import type { Drink } from "@/types";
import { DrinkCard } from "./DrinkCard";
import { GlassWater } from "lucide-react";

interface DrinkGridProps {
  drinks: Drink[];
  onSelect: (drink: Drink) => void;
  onClearFilters?: () => void;
}

export function DrinkGrid({
  drinks,
  onSelect,
  onClearFilters,
}: DrinkGridProps) {
  if (drinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/2 px-6 py-14 text-center">
        <div className="relative mb-4 flex size-14 items-center justify-center rounded-full bg-yellow/10 ring-1 ring-yellow/30">
          <GlassWater className="size-6 text-yellow" />
        </div>
        <h3 className="font-display text-lg font-bold text-cream">
          Nenhuma bebida encontrada
        </h3>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
          Tente buscar por Coca, Guaraná, Fanta ou Cajuína.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-yellow/15 px-4 py-2 font-mono text-xs font-bold text-yellow transition-all duration-200 hover:bg-yellow/25 active:scale-95"
          >
            Ver todas as bebidas
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
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
