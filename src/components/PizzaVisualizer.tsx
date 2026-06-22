import type { CSSProperties } from "react";

interface PizzaVisualizerProps {
  flavor1: string;
  flavor2: string;
  isHalf: boolean;
  size: "P" | "M" | "G";
  category: "salgada" | "doce";
}

const SLICES: Record<"P" | "M" | "G", number> = { P: 4, M: 6, G: 8 };

const SURFACE: Record<
  "salgada" | "doce",
  { left: { from: string; to: string }; right: { from: string; to: string } }
> = {
  salgada: {
    left: { from: "#591212", to: "#d90416" },
    right: { from: "#f20505", to: "#d90416" },
  },
  doce: {
    left: { from: "#f28705", to: "#f28705" },
    right: { from: "#f2b705", to: "#f2b705" },
  },
};

export function PizzaVisualizer({
  flavor1,
  flavor2,
  isHalf,
  size,
  category,
}: PizzaVisualizerProps) {
  const slices = SLICES[size];
  const surface = SURFACE[category];

  const r = 100;
  const crustW = 14;
  const innerR = r - crustW;
  const sliceLines = Array.from({ length: slices }, (_, i) => {
    const angle = (i * 360) / slices - 90;
    const rad = (angle * Math.PI) / 180;
    return {
      x1: 0,
      y1: 0,
      x2: innerR * Math.cos(rad),
      y2: innerR * Math.sin(rad),
    };
  });

  const label = (text: string) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= 1) return [text];
    if (words.length === 2) return [words[0], words[1]];
    return [
      words.slice(0, Math.ceil(words.length / 2)).join(" "),
      words.slice(Math.ceil(words.length / 2)).join(" "),
    ];
  };
  const l1 = label(flavor1);
  const l2 = label(flavor2);

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="relative animate-[wheelIn_0.5s_cubic-bezier(0.22,1,0.36,1)]">
        <svg
          viewBox="-110 -110 220 220"
          className="size-[180px] drop-shadow-[0_12px_40px_rgba(0,0,0,0.5)] sm:size-[220px]"
          role="img"
          aria-label={
            isHalf
              ? `Pizza ${size} meio a meio: ${flavor1} e ${flavor2}, ${slices} fatias`
              : `Pizza ${size} ${flavor1}, ${slices} fatias`
          }
        >
          <defs>
            <radialGradient id="crust" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#f2b705" />
              <stop offset="100%" stopColor="#f28705" />
            </radialGradient>
            <linearGradient id="surface-left" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={surface.left.from} />
              <stop offset="100%" stopColor={surface.left.to} />
            </linearGradient>
            <linearGradient id="surface-right" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={surface.right.from} />
              <stop offset="100%" stopColor={surface.right.to} />
            </linearGradient>
            <linearGradient id="surface-full" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={surface.left.from} />
              <stop offset="100%" stopColor={surface.right.to} />
            </linearGradient>
            <radialGradient id="sheen" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <clipPath id="leftHalf">
              <rect x={-r} y={-r} width={r} height={r * 2} />
            </clipPath>
            <clipPath id="rightHalf">
              <rect x={0} y={-r} width={r} height={r * 2} />
            </clipPath>
            <clipPath id="fullPie">
              <circle r={innerR} />
            </clipPath>
          </defs>

          <circle r={r} fill="url(#crust)" />
          <circle
            r={r}
            fill="none"
            stroke="#591212"
            strokeWidth="1.5"
            opacity="0.4"
          />

          {isHalf ? (
            <>
              <g clipPath="url(#leftHalf)">
                <circle r={innerR} fill="url(#surface-left)" />
              </g>
              <g clipPath="url(#rightHalf)">
                <circle r={innerR} fill="url(#surface-right)" />
              </g>
            </>
          ) : (
            <circle r={innerR} fill="url(#surface-full)" />
          )}

          <g clipPath="url(#fullPie)">
            <circle r={innerR} fill="url(#sheen)" />
            {sliceLines.map((l, i) => (
              <line
                key={i}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke="#f5ebd8"
                strokeOpacity="0.35"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 60,
                  animation: `sliceDraw 0.5s ${0.15 + i * 0.05}s both cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
              />
            ))}
          </g>

          {isHalf && (
            <line
              x1={0}
              y1={-innerR}
              x2={0}
              y2={innerR}
              stroke="#f5ebd8"
              strokeOpacity="0.7"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={
                {
                  "--wheel-split-h": "78%",
                  transformOrigin: "center",
                  transform: "scaleY(1)",
                  animation: "pizzaSplit 0.4s ease-out both",
                } as CSSProperties
              }
            />
          )}

          <circle r={6} fill="#f5ebd8" opacity="0.85" />
          <circle r={3} fill="#1a0606" opacity="0.4" />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex">
          <div className="flex flex-1 items-center justify-center px-3">
            <span
              key={flavor1}
              className="text-center font-display text-[0.62rem] font-semibold leading-tight text-cream sm:text-[0.72rem]"
              style={{ animation: "fadeUp 0.3s ease-out both" }}
            >
              {l1.map((w, i) => (
                <span key={i} className="block">
                  {w}
                </span>
              ))}
            </span>
          </div>
          {isHalf && (
            <div className="flex flex-1 items-center justify-center px-3">
              <span
                key={flavor2}
                className="text-center font-display text-[0.62rem] font-semibold leading-tight text-cream sm:text-[0.72rem]"
                style={{ animation: "fadeUp 0.3s ease-out both" }}
              >
                {l2.map((w, i) => (
                  <span key={i} className="block">
                    {w}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted">
        <span className="font-mono text-yellow">{slices}</span>
        <span>fatias</span>
        <span className="text-border">·</span>
        <span>Tam.</span>
        <span className="font-mono text-yellow">{size}</span>
        {isHalf && (
          <>
            <span className="text-border">·</span>
            <span className="text-yellow">meio a meio</span>
          </>
        )}
      </div>
    </div>
  );
}
