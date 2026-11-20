"use client";

import Link from "next/link";
import { PizzaImage } from "@/features/menu/components/PizzaImage";
import { formatPrice } from "@/lib/utils";
import type { Pizza } from "@/types";

interface PizzaCardProps {
  pizza: Pizza;
  paused: boolean;
  onSelect: (pizza: Pizza) => void;
}

export function PizzaCard({ pizza, paused, onSelect }: PizzaCardProps) {
  return (
    <article className="dluydd-card flex flex-col justify-between border border-border bg-card">
      <div>
        <Link
          href={`/pizza/${pizza.slug}`}
          className="block focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <PizzaImage imgIdx={pizza.imgIdx} name={pizza.name} />
        </Link>

        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-xl font-normal leading-snug text-foreground">
              <Link href={`/pizza/${pizza.slug}`} className="hover:underline">
                {pizza.name}
              </Link>
            </h3>
            {paused && (
              <span className="shrink-0 border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pausada
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {pizza.desc}
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-border p-4">
        <dl className="grid grid-cols-3 gap-2 text-xs">
          <div className="border-r border-border pr-2">
            <dt className="text-muted-foreground">P (4)</dt>
            <dd className="font-mono font-semibold text-foreground tabular-nums">
              R$ {formatPrice(pizza.p)}
            </dd>
          </div>
          <div className="border-r border-border pr-2">
            <dt className="text-muted-foreground">M (6)</dt>
            <dd className="font-mono font-semibold text-foreground tabular-nums">
              R$ {formatPrice(pizza.m)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">G (8)</dt>
            <dd className="font-mono font-semibold text-foreground tabular-nums">
              R$ {formatPrice(pizza.g)}
            </dd>
          </div>
        </dl>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={paused}
            onClick={() => onSelect(pizza)}
            className="h-11 flex-1 bg-primary px-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            style={{ borderRadius: "2px" }}
          >
            {paused ? "Indisponível" : "Montar pizza"}
          </button>
          <Link
            href={`/pizza/${pizza.slug}`}
            className="inline-flex h-11 items-center justify-center border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            style={{ borderRadius: "2px" }}
            aria-label={`Ver página da pizza ${pizza.name}`}
          >
            Detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}
