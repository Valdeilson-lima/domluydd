import { getPizzaImageSrc } from "@/lib/media";

interface PizzaVisualizerProps {
  flavor1: string;
  flavor1ImgIdx: number;
  flavor1Image?: string;
  flavor2?: string | null;
  flavor2ImgIdx?: number | null;
  flavor2Image?: string;
  isHalf?: boolean;
  sizeLabel?: string;
}

export function PizzaVisualizer({
  flavor1,
  flavor1ImgIdx,
  flavor1Image,
  flavor2,
  flavor2ImgIdx,
  flavor2Image,
  isHalf = false,
  sizeLabel,
}: PizzaVisualizerProps) {
  const showSplit = isHalf && Boolean(flavor2);
  const src1 = getPizzaImageSrc(flavor1ImgIdx, flavor1Image);
  const src2 =
    flavor2ImgIdx != null
      ? getPizzaImageSrc(flavor2ImgIdx, flavor2Image)
      : src1;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/60 p-3.5">
      <div
        className="relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/70 bg-secondary shadow-sm"
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
            <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(200,30,30,0.5)]" />
          </>
        )}
      </div>

      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-serif text-base font-bold leading-snug text-foreground">
          {showSplit ? `½ ${flavor1} + ½ ${flavor2}` : flavor1}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {showSplit
            ? "Meio a meio: vale o preço do sabor de maior valor no tamanho escolhido."
            : "Disco inteiro de sabor único."}
        </p>
        {sizeLabel && (
          <span className="inline-flex rounded-full bg-accent-gold-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-gold-ink">
            Tamanho {sizeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
