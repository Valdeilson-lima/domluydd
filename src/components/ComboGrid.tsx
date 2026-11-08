"use client";

import type { Combo } from "@/types";
import { ComboCard } from "./ComboCard";

interface ComboGridProps {
  combos: Combo[];
  onSelect: (combo: Combo) => void;
}

export function ComboGrid({ combos, onSelect }: ComboGridProps) {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {combos.map((combo) => (
        <ComboCard key={combo.id} combo={combo} onSelect={onSelect} />
      ))}
    </ul>
  );
}
