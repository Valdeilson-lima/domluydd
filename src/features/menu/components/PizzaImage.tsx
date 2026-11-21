import { getPizzaImageSrc } from "@/lib/media";

interface PizzaImageProps {
  imgIdx: number;
  image?: string;
  name: string;
  priority?: boolean;
  className?: string;
  wrapperClassName?: string;
}

export function PizzaImage({
  imgIdx,
  image,
  name,
  priority = false,
  className = "aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none",
  wrapperClassName = "overflow-hidden bg-secondary",
}: PizzaImageProps) {
  const src = getPizzaImageSrc(imgIdx, image);

  return (
    <div className={wrapperClassName}>
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
