import { PIZZA_IMAGES } from "@/data/pizzas";

interface PizzaImageProps {
  imgIdx: number;
  name: string;
  className?: string;
}

export function PizzaImage({
  imgIdx,
  name,
  className = "aspect-[4/3] w-full object-cover",
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
        width={800}
        height={600}
        className={className}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
