import type { Drink } from "@/types";
import { DrinkCard } from "./DrinkCard";

interface DrinkGridProps {
  drinks: Drink[];
  onSelect: (drink: Drink) => void;
}

export function DrinkGrid({ drinks, onSelect }: DrinkGridProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {drinks.map((drink) => (
        <DrinkCard key={drink.name} drink={drink} onSelect={onSelect} />
      ))}
    </div>
  );
}
