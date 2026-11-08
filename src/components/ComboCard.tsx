"use client";

import type { Combo } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Sparkles, Flame, Plus, Check } from "lucide-react";

interface ComboCardProps {
  combo: Combo;
  onSelect: (combo: Combo) => void;
}

export function ComboCard({ combo, onSelect }: ComboCardProps) {
  const discount = Math.round(
    ((combo.originalPrice - combo.price) / combo.originalPrice) * 100
  );

  return (
    <li className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-yellow/30 bg-linear-to-b from-[#25201a] via-[#1c191a] to-[#141213] p-5 shadow-lg transition-all duration-300 hover:border-yellow hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(242,183,5,0.15)] animate-[fadeUp_0.4s_both]">
      {/* Discount badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-red-primary px-2.5 py-1 font-mono text-[0.65rem] font-bold text-white shadow-md">
        <Flame className="size-3 text-yellow fill-yellow" />
        Economize {discount}%
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-yellow/20 text-yellow">
            <Sparkles className="size-4" />
          </span>
          <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-yellow">
            Oferta Especial
          </span>
        </div>

        <h3 className="font-display text-xl font-bold italic text-cream group-hover:text-yellow transition-colors">
          {combo.name}
        </h3>

        <p className="mt-2 text-xs text-cream-dim leading-relaxed">
          {combo.desc}
        </p>

        {/* Item check list */}
        <ul className="mt-4 space-y-1.5 border-t border-white/8 pt-3">
          {combo.items.map((it, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 text-xs text-muted"
            >
              <div className="size-4 rounded-full bg-yellow/15 text-yellow flex items-center justify-center shrink-0">
                <Check className="size-2.5 stroke-3" />
              </div>
              <span className="text-cream-dim">{it}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pricing & CTA */}
      <div className="mt-6 flex items-end justify-between border-t border-white/8 pt-4">
        <div>
          <span className="block text-[0.68rem] text-muted line-through font-mono">
            De R$ {formatPrice(combo.originalPrice)}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xs font-bold text-yellow">Por</span>
            <span className="font-display text-2xl font-bold text-yellow sm:text-3xl">
              R$ {formatPrice(combo.price)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(combo)}
          className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-red-primary to-yellow px-4 py-2.5 text-xs font-bold text-black shadow-md transition-all duration-200 hover:brightness-110 active:scale-95 cursor-pointer"
        >
          <Plus className="size-4" />
          Pedir Combo
        </button>
      </div>
    </li>
  );
}
