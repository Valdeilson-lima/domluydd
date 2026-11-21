"use client";

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
    <article className="flex flex-col justify-between border border-border bg-card p-5 transition-colors duration-150 hover:border-foreground/50">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-xl font-medium text-foreground">
            {combo.name}
          </h3>
          {paused ? (
            <span className="shrink-0 border border-border bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              Pausado
            </span>
          ) : savings > 0 ? (
            <span className="shrink-0 border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary tabular-nums">
              Economize R$ {formatPrice(savings)}
            </span>
          ) : null}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {combo.desc}
        </p>

        <ul className="space-y-1.5 border-t border-border pt-3 text-sm text-foreground">
          {combo.items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground line-through tabular-nums">
            De R$ {formatPrice(combo.originalPrice)}
          </p>
          <p className="font-mono text-lg font-semibold text-foreground tabular-nums">
            R$ {formatPrice(combo.price)}
          </p>
        </div>

        <button
          type="button"
          disabled={paused}
          onClick={() => onAdd(combo)}
          className="min-h-11 bg-primary px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          style={{ borderRadius: "2px" }}
        >
          {paused ? "Indisponível" : "Adicionar combo"}
        </button>
      </div>
    </article>
  );
}
