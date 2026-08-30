import { Wine, Snowflake } from "lucide-react";
import type { Drink } from "@/types";
import { formatPrice } from "@/lib/utils";

interface DrinkCardProps {
  drink: Drink;
  index: number;
  onSelect: (drink: Drink) => void;
}

const drinkStyle: Record<string, { ring: string; dot: string; chip: string }> =
  {
    coca: {
      ring: "ring-red-primary/50",
      dot: "bg-red-primary",
      chip: "bg-red-primary/12 text-red-light",
    },
    guarana: {
      ring: "ring-emerald-400/40",
      dot: "bg-emerald-400",
      chip: "bg-emerald-400/10 text-emerald-300",
    },
    fanta: {
      ring: "ring-orange-400/50",
      dot: "bg-orange-400",
      chip: "bg-orange-400/10 text-orange-300",
    },
    cajuina: {
      ring: "ring-yellow-light/50",
      dot: "bg-yellow-light",
      chip: "bg-yellow-light/10 text-yellow",
    },
  };

export function DrinkCard({ drink, index, onSelect }: DrinkCardProps) {
  const style = drinkStyle[drink.icon] ?? drinkStyle.coca;

  return (
    <li
      role="button"
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
      className="group flex cursor-pointer items-center gap-3 rounded-md border border-white/6 bg-black-light p-3 shadow-sm outline-none transition-all duration-300 hover:border-yellow/40 hover:bg-[#292526] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] focus-visible:border-yellow/60 focus-visible:-translate-y-0.5 animate-[fadeUp_0.4s_both] sm:p-4"
    >
      {/* Bottle mark com cor da marca */}
      <div
        className={`relative flex size-12 shrink-0 items-center justify-center rounded-full bg-black/40 ring-2 ${style.ring}`}
      >
        <Wine className="size-5 text-cream-dim" />
        <span
          className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-black-light ${style.dot}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-body text-[0.95rem] font-semibold leading-tight tracking-[-0.01em] text-cream sm:text-[1.05rem]">
          {drink.name}
        </h3>
        <div className="mt-0.5 flex items-center gap-1.5">
          <p className="truncate text-[0.72rem] text-muted sm:text-[0.78rem]">
            {drink.desc}
          </p>
          <span
            className={`flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[0.5rem] font-bold uppercase tracking-wider ${style.chip}`}
          >
            <Snowflake className="size-2.5" />
            Gelada
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="font-mono text-sm font-semibold text-yellow sm:text-base">
          R$ {formatPrice(drink.price)}
        </span>
        <span
          className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/3 text-muted transition-all duration-200 group-hover:border-yellow/60 group-hover:bg-yellow/15 group-hover:text-yellow"
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
    </li>
  );
}
