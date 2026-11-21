import { PIZZA_IMAGES } from "@/data/pizzas";

interface PizzaVisualizerProps {
  flavor1: string;
  flavor1ImgIdx: number;
  flavor2?: string | null;
  flavor2ImgIdx?: number | null;
  isHalf?: boolean;
  sizeLabel?: string;
}

export function PizzaVisualizer({
  flavor1,
  flavor1ImgIdx,
  flavor2,
  flavor2ImgIdx,
  isHalf = false,
  sizeLabel,
}: PizzaVisualizerProps) {
  const showSplit = isHalf && Boolean(flavor2);
  const src1 =
    PIZZA_IMAGES[flavor1ImgIdx % PIZZA_IMAGES.length] || PIZZA_IMAGES[1];
  const src2 =
    flavor2ImgIdx != null
      ? PIZZA_IMAGES[flavor2ImgIdx % PIZZA_IMAGES.length] || PIZZA_IMAGES[2]
      : src1;

  return (
    <div className="flex items-center gap-4 border border-border bg-card p-3.5">
      <div
        className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-foreground bg-secondary"
        aria-hidden="true"
      >
        <img
          src={src1}
          alt=""
          width={80}
          height={80}
          className="absolute inset-0 size-full object-cover"
          style={showSplit ? { clipPath: "inset(0 50% 0 0)" } : undefined}
        />
        {showSplit && (
          <>
            <img
              src={src2}
              alt=""
              width={80}
              height={80}
              className="absolute inset-0 size-full object-cover"
              style={{ clipPath: "inset(0 0 0 50%)" }}
            />
            <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-background shadow-[0_0_0_1px_rgba(125,12,20,0.45)]" />
          </>
        )}
      </div>

      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-serif text-base font-normal leading-snug text-foreground">
          {showSplit ? `½ ${flavor1} + ½ ${flavor2}` : flavor1}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {showSplit
            ? "Meio a meio: vale o preço do sabor de maior valor no tamanho escolhido."
            : "Disco inteiro de sabor único."}
        </p>
        {sizeLabel && (
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
            Tamanho {sizeLabel}
          </p>
        )}
      </div>
    </div>
  );
}
