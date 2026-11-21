"use client";

import { Check, Sparkles } from "lucide-react";
import { formatPrice, roundCurrency } from "@/lib/utils";
import type { Combo } from "@/types";

interface ComboCardProps {
  combo: Combo;
  paused: boolean;
  onAdd: (combo: Combo) => void;
}

export function ComboCard({ combo, paused, onAdd }: ComboCardProps) {
  const savings = roundCurrency(combo.originalPrice - combo.price);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:border-primary/35 hover:shadow-md">
      {combo.image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-secondary">
          <img
            src={combo.image}
            alt={combo.name}
            width={960}
            height={540}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none"
          />
          {!paused && savings > 0 && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent-gold px-3 py-1 text-xs font-extrabold text-foreground shadow-sm tabular-nums">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Economize R$ {formatPrice(savings)}
            </span>
          )}
          {paused && (
            <span className="absolute left-3 top-3 rounded-full bg-foreground/85 px-3 py-1 text-xs font-bold text-white">
              Pausado
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-3">
          <h3 className="font-serif text-xl font-bold text-foreground">
            {combo.name}
          </h3>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {combo.desc}
          </p>

          <ul className="space-y-1.5 border-t border-border pt-3 text-sm text-foreground">
            {combo.items.map((item) => (
              <li key={item} className="flex items-center gap-2 font-medium">
                <Check
                  className="size-4 shrink-0 text-status-open"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground line-through tabular-nums">
              De R$ {formatPrice(combo.originalPrice)}
            </p>
            <p className="text-xl font-extrabold text-primary tabular-nums">
              R$ {formatPrice(combo.price)}
            </p>
          </div>

          <button
            type="button"
            disabled={paused}
            onClick={() => onAdd(combo)}
            className="min-h-11 rounded-lg bg-primary px-5 text-xs font-bold text-primary-foreground shadow-xs transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {paused ? "Indisponível" : "Escolher sabores"}
          </button>
        </div>
      </div>
    </article>
  );
}
