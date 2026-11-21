import { PIZZA_IMAGES } from "@/data/pizzas";

interface PizzaImageProps {
  imgIdx: number;
  name: string;
  priority?: boolean;
  className?: string;
}

export function PizzaImage({
  imgIdx,
  name,
  priority = false,
  className = "aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none",
}: PizzaImageProps) {
  const src = PIZZA_IMAGES[imgIdx % PIZZA_IMAGES.length] || PIZZA_IMAGES[1];

  return (
    <div
      className="overflow-hidden bg-secondary"
      style={{ borderRadius: "0px" }}
    >
      <img
        src={src}
        alt={`Pizza sabor ${name}`}
        width={640}
        height={480}
        className={className}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </div>
  );
}
