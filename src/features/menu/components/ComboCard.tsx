"use client";

import { formatPrice } from "@/lib/utils";
import type { Combo } from "@/types";

interface ComboCardProps {
  combo: Combo;
  paused: boolean;
  onAdd: (combo: Combo) => void;
}

export function ComboCard({ combo, paused, onAdd }: ComboCardProps) {
  return (
    <article className="dluydd-card flex flex-col justify-between border border-border bg-card p-5">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-xl font-normal text-foreground">
            {combo.name}
          </h3>
          {paused && (
            <span className="shrink-0 border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pausado
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {combo.desc}
        </p>

        <ul className="space-y-1 border-t border-border pt-3 text-xs text-foreground">
          {combo.items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground line-through tabular-nums">
            R$ {formatPrice(combo.originalPrice)}
          </p>
          <p className="font-mono text-lg font-semibold text-foreground tabular-nums">
            R$ {formatPrice(combo.price)}
          </p>
        </div>

        <button
          type="button"
          disabled={paused}
          onClick={() => onAdd(combo)}
          className="h-11 bg-primary px-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          style={{ borderRadius: "2px" }}
        >
          {paused ? "Indisponível" : "Adicionar combo"}
        </button>
      </div>
    </article>
  );
}
