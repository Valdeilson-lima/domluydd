import type { Pizza } from "@/types";
import { PizzaCard } from "./PizzaCard";
import { SearchX, Pizza as PizzaIcon } from "lucide-react";

interface PizzaGridProps {
  pizzas: Pizza[];
  onSelect: (id: string) => void;
  onClearFilters?: () => void;
}

export function PizzaGrid({
  pizzas,
  onSelect,
  onClearFilters,
}: PizzaGridProps) {
  if (pizzas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/2 px-6 py-14 text-center">
        <div className="relative mb-4 flex size-14 items-center justify-center rounded-full bg-yellow/10 ring-1 ring-yellow/30">
          <SearchX className="size-6 text-yellow" />
        </div>
        <h3 className="font-display text-lg font-bold text-cream">
          Nenhuma pizza encontrada
        </h3>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
          Não encontramos nenhum sabor com os filtros aplicados. Que tal tentar
          outro termo ou ver todas as opções?
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-yellow/15 px-4 py-2 font-mono text-xs font-bold text-yellow transition-all duration-200 hover:bg-yellow/25 active:scale-95"
          >
            <PizzaIcon className="size-3.5" />
            Ver todas as pizzas
          </button>
        )}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
      {pizzas.map((pizza, i) => (
        <PizzaCard key={pizza.id} pizza={pizza} index={i} onSelect={onSelect} />
      ))}
    </ul>
  );
}
