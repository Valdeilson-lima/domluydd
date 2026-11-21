import { STORE_SHORT_NAME } from "@/lib/store-config";

interface BrandMarkProps {
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

export function BrandMark({
  subtitle,
  size = "md",
  inverted = false,
}: BrandMarkProps) {
  const iconSize =
    size === "lg" ? "size-11" : size === "sm" ? "size-8" : "size-9";
  const textSize =
    size === "lg"
      ? "text-2xl"
      : size === "sm"
        ? "text-base sm:text-lg"
        : "text-lg sm:text-xl";

  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <span
        className={`relative shrink-0 overflow-hidden rounded-xl ring-2 transition-transform duration-150 group-hover:scale-105 ${iconSize} ${
          inverted ? "ring-accent-gold shadow-md" : "ring-primary/20 shadow-sm"
        }`}
      >
        <img
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="size-full object-cover"
          aria-hidden="true"
        />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          translate="no"
          className={`truncate font-serif font-extrabold tracking-tight ${textSize} ${
            inverted ? "text-white" : "text-foreground"
          }`}
        >
          {STORE_SHORT_NAME}
        </span>
        {subtitle ? (
          <span
            className={`mt-0.5 truncate text-[11px] font-semibold uppercase tracking-wider ${
              inverted ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
