import { Wine } from "lucide-react";
import type { Drink } from "@/types";
import { formatPrice } from "@/lib/utils";

interface DrinkCardProps {
  drink: Drink;
  index: number;
  onSelect: (drink: Drink) => void;
}

const drinkStyle: Record<string, string> = {
  coca: "ring-red-primary/40",
  guarana: "ring-cream/20",
  fanta: "ring-yellow/40",
  cajuina: "ring-yellow-light/40",
};

export function DrinkCard({ drink, index, onSelect }: DrinkCardProps) {
  const ring = drinkStyle[drink.icon] ?? "ring-white/15";

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
      aria-label={`${drink.name}, R$ ${formatPrice(drink.price)}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className={`group flex cursor-pointer items-center gap-3 rounded-[14px] border border-white/6 bg-black-light p-3 shadow-sm outline-none transition-all duration-300 hover:border-yellow/40 hover:bg-[#2a1f16] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] focus-visible:border-yellow/60 focus-visible:-translate-y-0.5 animate-[fadeUp_0.4s_both] sm:p-4`}
    >
      {/* Bottle mark */}
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-black/40 ring-2 ${ring}`}
      >
        <Wine className="size-5 text-cream-dim" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-[0.95rem] font-semibold leading-tight tracking-[-0.01em] text-cream [font-variation-settings:'opsz'_36] sm:text-[1.05rem]">
          {drink.name}
        </h3>
        <p className="mt-0.5 truncate text-[0.72rem] text-muted sm:text-[0.78rem]">
          {drink.desc}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="font-mono text-sm font-semibold text-yellow sm:text-base">
          R$ {formatPrice(drink.price)}
        </span>
        <span
          className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted transition-all duration-200 group-hover:border-yellow/60 group-hover:bg-yellow/15 group-hover:text-yellow"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </div>
    </div>
  );
}
