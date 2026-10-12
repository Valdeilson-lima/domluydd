import type { Pizza } from "@/types";
import { formatPrice } from "@/lib/utils";
import { PizzaImage } from "./PizzaImage";
import { PIZZA_IMAGES } from "@/data/pizzas";
import { SlidersHorizontal, Flame } from "lucide-react";

interface PizzaCardProps {
  pizza: Pizza;
  index: number;
  onSelect: (id: string) => void;
}

const HIGHLIGHT_FLAVORS = new Set([
  "Calabresa",
  "4 Queijos",
  "Frango Catupiry",
  "Marguerita",
  "Portuguesa",
  "Brigadeiro",
]);

function menuNumber(pizza: Pizza): string {
  const match = pizza.id.match(/-(\d+)$/);
  const n = match ? Number(match[1]) + 1 : 0;
  return String(n).padStart(2, "0");
}

export function PizzaCard({ pizza, index, onSelect }: PizzaCardProps) {
  const isHighlight = HIGHLIGHT_FLAVORS.has(pizza.name);

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onSelect(pizza.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(pizza.id);
        }
      }}
      aria-label={`${pizza.name}, a partir de R$ ${formatPrice(pizza.p)}. Toque para personalizar.`}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
      className="group relative flex cursor-pointer overflow-hidden rounded-2xl border border-white/8 bg-linear-to-b from-[#1f1c1d] to-[#161415] shadow-sm outline-none transition-all duration-300 hover:border-yellow/50 hover:bg-[#252122] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)] focus-visible:border-yellow focus-visible:ring-2 focus-visible:ring-yellow/40 active:scale-[0.99] animate-[fadeUp_0.4s_both]"
    >
      {/* Thumbnail area with photo & overlays */}
      <div className="relative w-28 shrink-0 overflow-hidden sm:w-36">
        <PizzaImage
          src={PIZZA_IMAGES[pizza.imgIdx]}
          alt={pizza.name}
          className="h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-black/20 to-[#1f1c1d]/90 sm:to-[#1f1c1d]/80" />

        {/* Number Badge */}
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 font-mono text-[0.58rem] font-bold tracking-wider text-yellow shadow-md backdrop-blur-md">
          #{menuNumber(pizza)}
        </span>

        {/* Highlight Tag */}
        {isHighlight && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-red-primary/90 px-2 py-0.5 font-mono text-[0.52rem] font-bold uppercase tracking-wider text-cream shadow-md backdrop-blur-sm">
            <Flame className="size-2.5 text-yellow" />
            Favorita
          </span>
        )}
      </div>

      {/* Main card content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-bold italic leading-snug tracking-[-0.01em] text-cream transition-colors duration-200 group-hover:text-yellow sm:text-lg">
              {pizza.name}
            </h3>

            {pizza.category === "doce" && (
              <span className="shrink-0 rounded-full border border-yellow/30 bg-yellow/15 px-2 py-0.5 font-mono text-[0.52rem] font-bold uppercase tracking-wider text-yellow">
                Doce
              </span>
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted/90 sm:text-[0.8rem]">
            {pizza.desc}
          </p>
        </div>

        {/* Sizes prices & CTA footer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/6 pt-2.5">
          {/* Price tiers */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {(["P", "M", "G"] as const).map((sz) => (
              <span
                key={sz}
                className="inline-flex items-baseline gap-1 rounded-lg border border-white/8 bg-white/3 px-1.5 py-0.5 font-mono text-[0.62rem] font-medium text-cream-dim sm:px-2 sm:text-[0.68rem]"
              >
                <span className="font-bold text-muted text-[0.55rem] sm:text-[0.6rem]">
                  {sz}
                </span>
                <span className="font-semibold text-yellow">
                  R$ {formatPrice(pizza[sz.toLowerCase() as "p" | "m" | "g"])}
                </span>
              </span>
            ))}
          </div>

          {/* Action indicator */}
          <span className="flex items-center gap-1 text-[0.68rem] font-bold text-yellow/90 group-hover:text-yellow sm:text-xs">
            <SlidersHorizontal className="size-3 transition-transform duration-200 group-hover:scale-110" />
            <span className="hidden sm:inline">Montar pizza</span>
            <span className="sm:hidden">Pedir</span>
          </span>
        </div>
      </div>
    </li>
  );
}
