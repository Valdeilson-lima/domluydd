import { useMemo } from "react";
import { getPizzaByName, PIZZA_IMAGES } from "@/data/pizzas";
import { cn } from "@/lib/utils";
import { Flame, Sparkles } from "lucide-react";

interface PizzaVisualizerProps {
  flavor1: string;
  flavor2: string;
  isHalfHalf: boolean;
  size: "P" | "M" | "G";
  category: "salgada" | "doce";
}

const SIZE_DETAILS = {
  P: {
    slices: 4,
    diameter: "~20 cm",
    serves: "Individual (1 pessoa)",
    scale: "scale-85 sm:scale-90",
    sliceDegree: [0, 90],
  },
  M: {
    slices: 6,
    diameter: "~25 cm",
    serves: "2 a 3 pessoas (Mais pedida)",
    scale: "scale-95 sm:scale-100",
    sliceDegree: [0, 60, 120],
  },
  G: {
    slices: 8,
    diameter: "~35 cm",
    serves: "3 a 4 pessoas (Família)",
    scale: "scale-105 sm:scale-110",
    sliceDegree: [0, 45, 90, 135],
  },
};

export function PizzaVisualizer({
  flavor1,
  flavor2,
  isHalfHalf,
  size,
  category,
}: PizzaVisualizerProps) {
  const p1 = useMemo(() => getPizzaByName(flavor1), [flavor1]);
  const p2 = useMemo(() => getPizzaByName(flavor2), [flavor2]);

  const img1 = p1 ? PIZZA_IMAGES[p1.imgIdx] : PIZZA_IMAGES[0];
  const img2 = p2 ? PIZZA_IMAGES[p2.imgIdx] : img1;

  const sizeInfo = SIZE_DETAILS[size];

  return (
    <div className="relative flex flex-col items-center justify-center py-4 px-2 select-none overflow-hidden">
      {/* Ambient heat aura */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40 blur-2xl"
        aria-hidden
      >
        <div className="size-48 rounded-full bg-linear-to-tr from-red-primary/50 via-yellow/40 to-yellow-light/30 animate-pulse" />
      </div>

      {/* Top badges */}
      <div className="relative z-10 mb-3 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-yellow/30 bg-black/60 px-2.5 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-yellow backdrop-blur-md">
          <Flame className="size-3 text-yellow" />
          {sizeInfo.diameter} · {sizeInfo.slices} fatias
        </span>

        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[0.62rem] text-cream-dim backdrop-blur-md">
          <Sparkles className="size-3 text-yellow-light" />
          {sizeInfo.serves}
        </span>
      </div>

      {/* Pizza Plate container */}
      <div
        className={cn(
          "relative my-2 size-48 sm:size-56 transition-transform duration-500 ease-out",
          sizeInfo.scale
        )}
      >
        {/* Outer Wooden/Stone Peel Rim */}
        <div className="absolute inset-0 rounded-full border-[6px] border-[#36261b] bg-[#241711] shadow-[0_12px_36px_rgba(0,0,0,0.7),inset_0_2px_8px_rgba(255,255,255,0.08)] ring-1 ring-yellow/20" />

        {/* Artisanal Crust ring */}
        <div className="absolute inset-1.5 rounded-full border-[4px] border-[#92400e]/70 bg-black overflow-hidden shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]">
          {!isHalfHalf ? (
            /* Single Flavor Pizza */
            <div className="relative size-full animate-[fadeUp_0.3s_ease]">
              <img
                src={img1}
                alt={flavor1}
                className="size-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/35" />
            </div>
          ) : (
            /* Half-and-Half Split Pizza */
            <div className="relative size-full overflow-hidden animate-[fadeUp_0.3s_ease]">
              {/* Left Half (Flavor 1) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
              >
                <img
                  src={img1}
                  alt={flavor1}
                  className="size-full object-cover scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-black/40" />
              </div>

              {/* Right Half (Flavor 2) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)",
                }}
              >
                <img
                  src={img2}
                  alt={flavor2}
                  className="size-full object-cover scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-linear-to-l from-transparent via-transparent to-black/40" />
              </div>

              {/* Middle golden cut line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-linear-to-b from-yellow/90 via-yellow-light to-yellow/90 shadow-[0_0_8px_rgba(242,183,5,0.8)]" />

              {/* Center Meio a Meio cutter badge */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow/60 bg-black/85 px-1.5 py-0.5 font-mono text-[0.5rem] font-bold uppercase tracking-wider text-yellow shadow-lg backdrop-blur-sm">
                ½ / ½
              </div>
            </div>
          )}

          {/* Slices Overlay Guidelines */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
            {sizeInfo.sliceDegree.map((deg) => (
              <div
                key={deg}
                className="absolute h-full w-[1px] bg-white/40"
                style={{ transform: `rotate(${deg}deg)` }}
              />
            ))}
          </div>
        </div>

        {/* Gloss highlight on crust */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-white/5 to-white/15" />
      </div>

      {/* Flavor labels footer */}
      {isHalfHalf ? (
        <div className="relative z-10 mt-2 flex w-full max-w-xs items-center justify-between gap-2 px-3">
          <div className="flex-1 text-center">
            <span className="font-mono text-[0.55rem] font-bold uppercase tracking-wider text-yellow">
              1ª Metade (Esquerda)
            </span>
            <p className="truncate text-xs font-semibold text-cream">
              {flavor1 || "Selecione"}
            </p>
          </div>
          <div className="h-5 w-px bg-white/10" />
          <div className="flex-1 text-center">
            <span className="font-mono text-[0.55rem] font-bold uppercase tracking-wider text-yellow">
              2ª Metade (Direita)
            </span>
            <p className="truncate text-xs font-semibold text-cream">
              {flavor2 || "Selecione"}
            </p>
          </div>
        </div>
      ) : (
        <p className="relative z-10 mt-1 font-body text-xs font-medium text-cream-dim/80">
          Pizza inteira · {category === "doce" ? "Sabor doce" : "Sabor salgado"}
        </p>
      )}
    </div>
  );
}
