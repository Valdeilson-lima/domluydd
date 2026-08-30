import type { Pizza } from "@/types";
import { formatPrice } from "@/lib/utils";
import { PizzaImage } from "./PizzaImage";
import { PIZZA_IMAGES } from "@/data/pizzas";

interface PizzaCardProps {
  pizza: Pizza;
  index: number;
  onSelect: (id: string) => void;
}

function menuNumber(pizza: Pizza): string {
  const match = pizza.id.match(/-(\d+)$/);
  const n = match ? Number(match[1]) + 1 : 0;
  return String(n).padStart(2, "0");
}

export function PizzaCard({ pizza, index, onSelect }: PizzaCardProps) {
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
      aria-label={`${pizza.name}, a partir de R$ ${formatPrice(pizza.p)}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="group flex cursor-pointer overflow-hidden rounded-md border border-white/6 bg-black-light shadow-sm outline-none transition-all duration-300 hover:border-yellow/40 hover:bg-[#292526] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)] focus-visible:border-yellow/60 focus-visible:-translate-y-0.5 animate-[fadeUp_0.4s_both]"
    >
      {/* Thumbnail */}
      <div className="relative w-24 shrink-0 overflow-hidden sm:w-32">
        <PizzaImage
          src={PIZZA_IMAGES[pizza.imgIdx]}
          className="h-full w-full"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black-light/70 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 font-mono text-[0.55rem] font-semibold tracking-wider text-yellow backdrop-blur-sm">
          N°{menuNumber(pizza)}
        </span>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3 sm:px-4 sm:py-4">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate font-body text-[0.95rem] font-semibold leading-tight tracking-[-0.01em] text-cream sm:text-[1.05rem]">
            {pizza.name}
          </h3>
          {pizza.category === "doce" && (
            <span className="shrink-0 rounded-full bg-yellow/15 px-1.5 py-0.5 font-mono text-[0.5rem] font-bold uppercase tracking-wider text-yellow">
              doce
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-[0.72rem] text-muted leading-relaxed sm:text-[0.78rem]">
          {pizza.desc}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {(["P", "M", "G"] as const).map((sz) => (
            <span
              key={sz}
              className="inline-flex items-baseline gap-1 rounded-md border border-white/8 bg-white/3 px-2 py-0.5 font-mono text-[0.6rem] font-semibold text-cream-dim sm:text-[0.65rem]"
            >
              <span className="font-body text-[0.55rem] font-bold text-muted sm:text-[0.6rem]">
                {sz}
              </span>
              R$ {formatPrice(pizza[sz.toLowerCase() as "p" | "m" | "g"])}
            </span>
          ))}
        </div>
      </div>

      {/* Arrow affordance */}
      <div className="flex shrink-0 items-center pr-3.5 sm:pr-4">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 text-muted/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-yellow"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </li>
  );
}
