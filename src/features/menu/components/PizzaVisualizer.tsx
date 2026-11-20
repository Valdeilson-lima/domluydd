interface PizzaVisualizerProps {
  flavor1: string;
  flavor2?: string | null;
  isHalf?: boolean;
  sizeLabel?: string;
}

export function PizzaVisualizer({
  flavor1,
  flavor2,
  isHalf = false,
  sizeLabel,
}: PizzaVisualizerProps) {
  const showSplit = isHalf && Boolean(flavor2);

  return (
    <div className="flex items-center gap-4 border border-border bg-secondary/60 p-3">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="#d6d6d6"
          stroke="#7d0c14"
          strokeWidth="2"
        />
        {showSplit ? (
          <>
            <path
              d="M32 6 A26 26 0 0 0 32 58 Z"
              fill="#7d0c14"
              fillOpacity="0.16"
            />
            <path
              d="M32 6 A26 26 0 0 1 32 58 Z"
              fill="#7d0c14"
              fillOpacity="0.34"
            />
            <line
              x1="32"
              y1="3"
              x2="32"
              y2="61"
              stroke="#7d0c14"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <circle cx="32" cy="32" r="24" fill="#7d0c14" fillOpacity="0.18" />
        )}
      </svg>

      <div className="min-w-0 text-sm">
        <p className="font-semibold text-foreground">
          {showSplit ? `½ ${flavor1} + ½ ${flavor2}` : flavor1}
        </p>
        <p className="text-xs text-muted-foreground">
          {showSplit
            ? "Cobrança pelo sabor de maior valor no tamanho escolhido"
            : "Pizza inteira de sabor único"}
          {sizeLabel ? ` · ${sizeLabel}` : ""}
        </p>
      </div>
    </div>
  );
}
