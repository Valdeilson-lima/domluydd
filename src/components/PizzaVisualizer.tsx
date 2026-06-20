interface PizzaVisualizerProps {
  flavor1: string;
  flavor2: string;
  isHalf: boolean;
}

const COLORS = {
  halfLeft: {
    bg: "linear-gradient(135deg, #c73b2a, #d45a3a)",
    label: "text-black",
  },
  halfRight: {
    bg: "linear-gradient(135deg, #d4a54a, #e8c06a)",
    label: "text-black",
  },
  unified: {
    bg: "linear-gradient(135deg, #d4a54a, #e8c06a)",
    label: "text-black",
  },
};

export function PizzaVisualizer({
  flavor1,
  flavor2,
  isHalf,
}: PizzaVisualizerProps) {
  const renderHalf = (flavor: string, side: "left" | "right") => {
    const isLeft = side === "left";
    const isActive = isLeft || (!isLeft && isHalf);
    const bg = isHalf
      ? isLeft
        ? COLORS.halfLeft
        : COLORS.halfRight
      : COLORS.unified;

    return (
      <div
        className={`relative flex flex-1 items-center justify-center overflow-hidden p-2 transition-all duration-500 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{ background: bg.bg, opacity: isActive ? 0.3 : 0 }}
        />
        <span className="relative z-1 text-center font-display text-[0.55rem] font-bold leading-tight text-black break-words max-w-full transition-all duration-300 sm:text-[0.65rem]">
          {isActive ? flavor : ""}
        </span>
      </div>
    );
  };

  return (
    <div className="my-6 flex justify-center sm:my-8">
      <div className="relative flex size-[170px] overflow-hidden rounded-full bg-yellow shadow-[0_4px_30px_rgba(245,166,35,0.3)] transition-all duration-500 sm:size-[200px]">
        {/* Outer ring decoration */}
        <div className="absolute inset-1 rounded-full border-2 border-white/10 pointer-events-none" />

        {renderHalf(flavor1, "left")}

        {isHalf && (
          <div className="w-1 shrink-0 bg-white/70 animate-[pizzaSplit_0.3s_ease] relative z-2" />
        )}

        {renderHalf(flavor2, "right")}
      </div>
    </div>
  );
}
