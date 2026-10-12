import { Wine, Snowflake, Plus } from "lucide-react";
import type { Drink } from "@/types";
import { formatPrice } from "@/lib/utils";

interface DrinkCardProps {
  drink: Drink;
  index: number;
  onSelect: (drink: Drink) => void;
}

const DRINK_THEMES: Record<
  string,
  { ring: string; dot: string; chip: string; bg: string }
> = {
  coca: {
    ring: "ring-red-500/40",
    dot: "bg-red-500",
    chip: "bg-red-500/12 text-red-400 border-red-500/20",
    bg: "from-red-950/20 to-black-light",
  },
  guarana: {
    ring: "ring-emerald-500/40",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
    bg: "from-emerald-950/20 to-black-light",
  },
  fanta: {
    ring: "ring-amber-500/40",
    dot: "bg-amber-500",
    chip: "bg-amber-500/12 text-amber-400 border-amber-500/20",
    bg: "from-amber-950/20 to-black-light",
  },
  cajuina: {
    ring: "ring-yellow/40",
    dot: "bg-yellow",
    chip: "bg-yellow/12 text-yellow border-yellow/20",
    bg: "from-yellow-950/20 to-black-light",
  },
};

export function DrinkCard({ drink, index, onSelect }: DrinkCardProps) {
  const theme = DRINK_THEMES[drink.icon] ?? DRINK_THEMES.coca;

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
      aria-label={`Adicionar ${drink.name}, R$ ${formatPrice(drink.price)}`}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
      className="group relative flex cursor-pointer items-center gap-3.5 rounded-2xl border border-white/8 bg-linear-to-b from-[#1f1c1d] to-[#161415] p-3.5 shadow-sm outline-none transition-all duration-300 hover:border-yellow/50 hover:bg-[#252122] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.4)] focus-visible:border-yellow focus-visible:ring-2 focus-visible:ring-yellow/40 active:scale-[0.99] animate-[fadeUp_0.4s_both] sm:p-4"
    >
      {/* Icon badge */}
      <div
        className={`relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-black/60 ring-2 ${theme.ring} shadow-md`}
      >
        <Wine className="size-5 text-cream-dim transition-transform duration-300 group-hover:scale-110" />
        <span
          className={`absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-black ${theme.dot}`}
        />
      </div>

      {/* Drink Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-sm font-bold italic text-cream sm:text-base">
            {drink.name}
          </h3>
          <span
            className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.2 font-mono text-[0.52rem] font-bold uppercase tracking-wider ${theme.chip}`}
          >
            <Snowflake className="size-2.5" />
            Gelada
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted/80">{drink.desc}</p>
      </div>

      {/* Price & Add Action */}
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-mono text-sm font-bold text-yellow sm:text-base">
          R$ {formatPrice(drink.price)}
        </span>
        <button
          type="button"
          tabIndex={-1}
          className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-cream-dim transition-all duration-200 group-hover:border-yellow group-hover:bg-yellow group-hover:text-black group-hover:shadow-[0_0_12px_rgba(242,183,5,0.4)] active:scale-90"
          aria-hidden
        >
          <Plus className="size-4.5" />
        </button>
      </div>
    </li>
  );
}
