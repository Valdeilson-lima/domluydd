import type { Pizza } from "@/types";
import { formatPrice } from "@/lib/utils";

const PIZZA_IMAGES = [
  "https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_960_720.jpg",
  "https://cdn.pixabay.com/photo/2020/06/08/16/49/pizza-5275191_960_720.jpg",
  "https://cdn.pixabay.com/photo/2016/04/21/22/50/pizza-1344720_960_720.jpg",
  "https://cdn.pixabay.com/photo/2014/04/22/02/56/pizza-329523_960_720.jpg",
  "https://cdn.pixabay.com/photo/2014/07/08/12/34/pizza-386717_960_720.jpg",
  "https://img.freepik.com/free-photo/pizza-pizza-filled-with-tomatoes-salami-olives_140725-1200.jpg",
  "https://img.freepik.com/free-photo/delicious-pizza-with-vegetables_144627-22184.jpg",
  "https://img.freepik.com/free-photo/top-view-pepperoni-pizza-with-mushrooms-sliced_141793-2144.jpg",
];

interface PizzaCardProps {
  pizza: Pizza;
  onSelect: (id: string) => void;
}

export function PizzaCard({ pizza, onSelect }: PizzaCardProps) {
  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={() => onSelect(pizza.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(pizza.id);
        }
      }}
      aria-label={pizza.name}
      className="group flex cursor-pointer overflow-hidden rounded-[14px] bg-black-light shadow-sm transition-all duration-300 border border-white/6 hover:shadow-md hover:-translate-y-0.5 hover:border-red-primary/30 focus-visible:outline-offset-[-3px]"
    >
      <div className="w-28 shrink-0 overflow-hidden sm:w-36">
        <img
          src={PIZZA_IMAGES[pizza.imgIdx]}
          alt={pizza.name}
          loading="lazy"
          className="h-full w-full object-cover bg-black transition-transform duration-400 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1 px-3 py-3 sm:px-4 sm:py-4">
        <div className="font-display text-sm font-bold text-yellow sm:text-base">
          {pizza.name}
        </div>
        <div className="line-clamp-1 text-[0.72rem] text-muted leading-relaxed sm:text-xs">
          {pizza.desc}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {(["P", "M", "G"] as const).map((size) => (
            <span
              key={size}
              className="rounded-[999px] border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[0.6rem] font-semibold text-white sm:px-2.5 sm:text-[0.65rem]"
            >
              <span className="mr-0.5 font-body font-semibold text-muted">
                {size}
              </span>
              R$ {formatPrice(pizza[size.toLowerCase() as "p" | "m" | "g"])}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
