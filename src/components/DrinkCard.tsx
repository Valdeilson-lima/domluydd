import { Wine } from "lucide-react";
import type { Drink } from "@/types";
import { formatPrice } from "@/lib/utils";

interface DrinkCardProps {
  drink: Drink;
  onSelect: (drink: Drink) => void;
}

const iconBg: Record<string, string> = {
  coca: "bg-red-primary/20 text-red-light",
  guarana: "bg-white/15 text-white",
  fanta: "bg-yellow/20 text-yellow",
  cajuina: "bg-yellow-light/15 text-yellow-light",
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
      aria-label={drink.name}
      className="group flex cursor-pointer overflow-hidden rounded-[14px] bg-black-light shadow-sm transition-all duration-300 border border-white/6 hover:shadow-md hover:-translate-y-0.5 hover:border-red-primary/30 focus-visible:outline-offset-[-3px]"
    >
      <div
        className={`flex w-24 shrink-0 items-center justify-center sm:w-28 ${iconBg[drink.icon] || "bg-white/8 text-white"}`}
      >
        <Wine className="size-7 sm:size-9" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1 px-3 py-3 sm:px-4 sm:py-4">
        <div className="font-display text-sm font-bold text-yellow sm:text-base">
          {drink.name}
        </div>
        <div className="line-clamp-1 text-[0.72rem] text-muted leading-relaxed sm:text-xs">
          {drink.desc}
        </div>
        <div className="mt-1">
          <span className="inline-block rounded-[999px] border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[0.6rem] font-semibold text-white sm:text-[0.65rem]">
            <span className="mr-0.5 font-body font-semibold text-muted">
              Un
            </span>
            R$ {formatPrice(drink.price)}
          </span>
        </div>
      </div>
    </div>
  );
}
