"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Placeholder elegante (pizza em SVG) usado quando a imagem não carrega. */
const FALLBACK_IMG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#2a2627"/>
          <stop offset="1" stop-color="#3a1418"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#g)"/>
      <text x="200" y="160" font-size="96" text-anchor="middle" dominant-baseline="central">🍕</text>
    </svg>`
  );

interface PizzaImageProps {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}

/** Imagem de pizza otimizada via Next.js Image com fallback automático. */
export function PizzaImage({
  src,
  alt = "",
  className,
  imgClassName,
}: PizzaImageProps) {
  const [failed, setFailed] = useState(false);

  const finalSrc = failed ? FALLBACK_IMG : src;

  return (
    <div className={cn("relative overflow-hidden bg-black", className)}>
      <Image
        src={finalSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 120px, (max-width: 1024px) 160px, 320px"
        onError={() => setFailed(true)}
        className={cn("object-cover", imgClassName)}
      />
    </div>
  );
}
