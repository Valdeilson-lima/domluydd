"use client";

import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:border-primary/35 hover:shadow-md">
      {/* LAYOUT MOBILE COMPACTO HORIZONTAL (< sm) */}
      <div className="flex items-stretch gap-3 p-3 sm:hidden">
        <button
          type="button"
          disabled={paused}
          onClick={() => onSelect(pizza, "m")}
          className="relative size-26 shrink-0 overflow-hidden rounded-xl bg-secondary text-left disabled:opacity-50"
          aria-label={`Montar pizza ${pizza.name}`}
        >
          <PizzaImage
            imgIdx={pizza.imgIdx}
            image={pizza.image}
            name={pizza.name}
            className="size-26 object-cover"
          />
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-1.5">
              <h3 className="font-serif text-base font-bold leading-snug text-foreground">
                <Link
                  href={`/pizza/${pizza.slug}`}
                  className="hover:text-primary"
                >
                  {pizza.name}
                </Link>
              </h3>
              {paused ? (
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  Pausada
                </span>
              ) : pizza.highlight ? (
                <span className="shrink-0 rounded-full bg-accent-gold-soft px-2 py-0.5 text-[10px] font-bold text-accent-gold-ink">
                  Pedida
                </span>
              ) : null}
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {pizza.desc}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div>
              <span className="block text-[10px] font-medium text-muted-foreground">
                A partir de
              </span>
              <span className="text-sm font-extrabold text-foreground tabular-nums">
                R$ {formatPrice(pizza.p)}
              </span>
            </div>

            <button
              type="button"
              disabled={paused}
              onClick={() => onSelect(pizza, "m")}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-primary px-3.5 text-xs font-bold text-primary-foreground transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {paused ? "Pausada" : "Montar"}
            </button>
          </div>
        </div>
      </div>

      {/* LAYOUT DESKTOP / TABLET (>= sm) */}
      <div className="hidden flex-1 flex-col justify-between sm:flex">
        <div>
          <button
            type="button"
            disabled={paused}
            onClick={() => onSelect(pizza, "m")}
            className="block w-full text-left disabled:cursor-not-allowed"
            aria-label={`Personalizar pizza ${pizza.name}`}
          >
            <PizzaImage
              imgIdx={pizza.imgIdx}
              image={pizza.image}
              name={pizza.name}
            />
          </button>

          <div className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-xl font-bold leading-snug text-foreground">
                <Link
                  href={`/pizza/${pizza.slug}`}
                  className="transition-colors hover:text-primary"
                >
                  {pizza.name}
                </Link>
              </h3>
              {paused ? (
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                  Pausada
                </span>
              ) : pizza.highlight ? (
                <span className="shrink-0 rounded-full bg-accent-gold-soft px-2.5 py-0.5 text-xs font-bold text-accent-gold-ink">
                  Pedida da casa
                </span>
              ) : null}
            </div>

            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {pizza.desc}
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-border/80 bg-background/40 p-4">
          <div
            className="grid grid-cols-3 gap-1.5"
            aria-label={`Escolher tamanho para ${pizza.name}`}
          >
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                disabled={paused}
                onClick={() => onSelect(pizza, opt.key)}
                className="flex min-h-11 flex-col items-start justify-center rounded-lg border border-border bg-card px-2.5 py-1.5 text-left transition-[background-color,border-color,transform] duration-150 hover:border-primary hover:bg-secondary/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label={`Montar ${pizza.name} tamanho ${opt.label} (${opt.slices} fatias) por R$ ${formatPrice(pizza[opt.key])}`}
              >
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {opt.label} · {opt.slices}f
                </span>
                <span className="text-xs font-extrabold text-foreground tabular-nums">
                  R$ {formatPrice(pizza[opt.key])}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paused}
              onClick={() => onSelect(pizza, "m")}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-xs transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="size-4" aria-hidden="true" />
              {paused ? "Indisponível" : "Montar pizza"}
            </button>
            <Link
              href={`/pizza/${pizza.slug}`}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              aria-label={`Abrir página completa da pizza ${pizza.name}`}
              title={`Ver página de ${pizza.name}`}
            >
              <ExternalLink className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
