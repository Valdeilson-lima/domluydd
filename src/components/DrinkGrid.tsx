import type { Drink } from "@/types";
import { DrinkCard } from "./DrinkCard";

interface DrinkGridProps {
  drinks: Drink[];
  onSelect: (drink: Drink) => void;
}

export function DrinkGrid({ drinks, onSelect }: DrinkGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 max-md:max-421-max-480:grid-cols-1">
      {drinks.map((drink) => (
        <DrinkCard key={drink.name} drink={drink} onSelect={onSelect} />
      ))}
    </div>
  );
}
