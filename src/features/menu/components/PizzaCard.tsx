"use client";

import Link from "next/link";
import { PizzaImage } from "@/features/menu/components/PizzaImage";
import type { PizzaSizeKey } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import type { Pizza } from "@/types";

interface PizzaCardProps {
  pizza: Pizza;
  paused: boolean;
  onSelect: (pizza: Pizza, initialSize?: PizzaSizeKey) => void;
}

const SIZE_OPTIONS: Array<{
  key: PizzaSizeKey;
  label: string;
  slices: string;
}> = [
  { key: "p", label: "P", slices: "4" },
  { key: "m", label: "M", slices: "6" },
  { key: "g", label: "G", slices: "8" },
];

export function PizzaCard({ pizza, paused, onSelect }: PizzaCardProps) {
  return (
    <article className="group flex flex-col justify-between border border-border bg-card transition-colors duration-150 hover:border-foreground/50">
      <div>
        <Link href={`/pizza/${pizza.slug}`} className="block">
          <PizzaImage imgIdx={pizza.imgIdx} name={pizza.name} />
        </Link>

        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-xl font-medium leading-snug text-foreground">
              <Link
                href={`/pizza/${pizza.slug}`}
                className="hover:text-primary hover:underline"
              >
                {pizza.name}
              </Link>
            </h3>
            {paused ? (
              <span className="shrink-0 border border-border bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                Pausada
              </span>
            ) : pizza.highlight ? (
              <span className="shrink-0 border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                Pedida da casa
              </span>
            ) : null}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {pizza.desc}
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-border p-4">
        <div
          className="grid grid-cols-3 gap-2"
          aria-label={`Escolher tamanho para ${pizza.name}`}
        >
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              disabled={paused}
              onClick={() => onSelect(pizza, opt.key)}
              className="flex min-h-11 flex-col items-start justify-center border border-border bg-background px-2.5 py-1.5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-primary hover:bg-secondary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              style={{ borderRadius: "2px" }}
              aria-label={`Montar ${pizza.name} tamanho ${opt.label} (${opt.slices} fatias) por R$ ${formatPrice(pizza[opt.key])}`}
            >
              <span className="text-xs font-medium text-muted-foreground">
                {opt.label} ({opt.slices})
              </span>
              <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                R$ {formatPrice(pizza[opt.key])}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={paused}
            onClick={() => onSelect(pizza, "m")}
            className="min-h-11 flex-1 bg-primary px-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            style={{ borderRadius: "2px" }}
          >
            {paused ? "Indisponível" : "Montar pizza"}
          </button>
          <Link
            href={`/pizza/${pizza.slug}`}
            className="inline-flex min-h-11 items-center justify-center border border-border bg-background px-3.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground hover:bg-secondary"
            style={{ borderRadius: "2px" }}
            aria-label={`Abrir página completa da pizza ${pizza.name}`}
          >
            Ver página
          </Link>
        </div>
      </div>
    </article>
  );
}
