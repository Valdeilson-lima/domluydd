import type { Drink } from "@/types";
import { formatPrice } from "@/lib/utils";

interface DrinkCardProps {
  drink: Drink;
  onSelect: (drink: Drink) => void;
}

const iconMap: Record<string, string> = {
  coca: "bg-red-primary/20 text-red-light",
  guarana: "bg-white/8 text-white",
  fanta: "bg-yellow/20 text-yellow",
  cajuina: "bg-yellow-light/15 text-yellow-light",
};

const iconSymbol: Record<string, string> = {
  coca: "C",
  guarana: "G",
  fanta: "F",
  cajuina: "Cj",
};

export function DrinkCard({ drink, onSelect }: DrinkCardProps) {
  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={() => onSelect(drink)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(drink);
        }
      }}
      className="flex cursor-pointer items-center gap-3.5 rounded-[14px] border border-white/6 bg-black-light p-3.5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-yellow/30"
    >
      <div
        className={`flex size-[42px] shrink-0 items-center justify-center rounded-[8px] text-sm font-bold ${iconMap[drink.icon] || "bg-white/8 text-white"}`}
      >
        {iconSymbol[drink.icon] || drink.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{drink.name}</div>
      </div>
      <div className="font-mono text-base font-semibold text-yellow shrink-0">
        R$ {formatPrice(drink.price)}
      </div>
    </div>
  );
}
