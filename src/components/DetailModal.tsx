import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { getPizzaByName, salgadas, doces } from "@/data/pizzas";
import type { Pizza, CartItem } from "@/types";
import { SplitSquareHorizontal, Plus } from "lucide-react";
import { PizzaVisualizer } from "./PizzaVisualizer";

interface DetailModalProps {
  pizza: Pizza | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: Omit<CartItem, "id" | "qty">) => void;
}

const SIZES = ["P", "M", "G"] as const;

const SIZE_META = {
  P: { fatias: 4, cor: "#d90416" },
  M: { fatias: 6, cor: "#f28705" },
  G: { fatias: 8, cor: "#f2b705" },
} as const;

export function DetailModal({
  pizza,
  open,
  onOpenChange,
  onAddToCart,
}: DetailModalProps) {
  const initialFlavor = pizza?.name ?? "";
  const [size, setSize] = useState<"P" | "M" | "G">("M");
  const [flavor1, setFlavor1] = useState(initialFlavor);
  const [flavor2, setFlavor2] = useState(initialFlavor);
  const [halfHalf, setHalfHalf] = useState(false);

  if (!pizza) return null;

  const catPizzas = pizza.category === "doce" ? doces : salgadas;
  const showSecondFlavor = halfHalf;

  const getPrice = (name: string, s: string) => {
    const p = getPizzaByName(name);
    if (!p) return 0;
    return p[s.toLowerCase() as "p" | "m" | "g"] || 0;
  };

  const total = Math.max(getPrice(flavor1, size), getPrice(flavor2, size));

  const handleFlavor1Change = (val: string) => {
    setFlavor1(val);
    if (!halfHalf) setFlavor2(val);
  };

  const handleToggleHalf = () => {
    const next = !halfHalf;
    setHalfHalf(next);
    if (!next) setFlavor2(flavor1);
  };

  const handleAdd = () => {
    const catLabel = pizza.category === "doce" ? "Doce" : "Salgada";
    onAddToCart({
      flavors: [
        { name: flavor1, price: getPrice(flavor1, size) },
        { name: flavor2, price: getPrice(flavor2, size) },
      ],
      size,
      price: total,
      category: catLabel,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] max-h-[92vh] p-0 gap-0 flex flex-col overflow-hidden rounded-[20px] border-yellow/15">
        <div className="overflow-y-auto flex-1">
          {/* Hero: the pizza wheel signature */}
          <div className="relative bg-linear-to-br from-[#141213] via-[#1f1c1d] to-[#3a1418] px-5 pt-6 pb-4 sm:px-7 sm:pt-8 sm:pb-5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(242,135,5,0.1),transparent_70%)]" />
            <div className="relative flex flex-col items-center gap-3">
              <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-yellow/70">
                {pizza.category === "doce" ? "Pizza Doce" : "Pizza Salgada"}
              </span>
              <h2 className="text-center font-display text-[1.7rem] font-semibold italic leading-none tracking-[-0.02em] text-cream [font-variation-settings:'opsz'_144,'SOFT'_50] sm:text-[2.1rem]">
                {pizza.name}
              </h2>
            </div>

            <div className="relative mt-2">
              <PizzaVisualizer
                flavor1={flavor1}
                flavor2={flavor2}
                isHalf={halfHalf}
                size={size}
                category={pizza.category}
              />
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-white/6 px-5 pt-5 pb-4 sm:px-7 sm:pt-6 sm:pb-5">
            <p className="text-sm leading-relaxed text-cream-dim">
              {pizza.desc}
            </p>
          </div>

          {/* Configuration */}
          <div className="space-y-5 px-5 pb-5 sm:px-7 sm:pb-6">
            {/* Size Selector */}
            <div className="space-y-2.5">
              <label className="block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
                Tamanho
              </label>
              <div className="flex gap-2.5">
                {SIZES.map((s) => {
                  const price1 = getPrice(flavor1, s);
                  const price2 = getPrice(flavor2, s);
                  const maxP = Math.max(price1, price2);
                  const active = size === s;
                  const meta = SIZE_META[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      type="button"
                      className={`relative flex-1 cursor-pointer rounded-[12px] border px-2 py-3 text-center transition-all duration-200 ${
                        active
                          ? "border-yellow/60 bg-yellow/10 shadow-[inset_0_0_0_1px_rgba(242,183,5,0.3)]"
                          : "border-white/8 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <span
                        className="mx-auto mb-1 block size-2.5 rounded-full"
                        style={{ background: meta.cor }}
                      />
                      <span
                        className={`block font-body text-base font-bold leading-tight ${
                          active ? "text-yellow" : "text-cream"
                        }`}
                      >
                        {s}
                      </span>
                      <span
                        className={`mt-0.5 block font-mono text-[0.65rem] font-semibold ${
                          active ? "text-yellow" : "text-muted"
                        }`}
                      >
                        R$ {formatPrice(maxP)}
                      </span>
                      <span className="mt-0.5 block text-[0.55rem] uppercase tracking-wide text-muted/60">
                        {meta.fatias} fatias
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Half-half toggle */}
            <button
              type="button"
              onClick={handleToggleHalf}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-[12px] border px-4 py-3.5 transition-all duration-200 ${
                halfHalf
                  ? "border-yellow/50 bg-yellow/8"
                  : "border-white/8 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <SplitSquareHorizontal
                className={`size-5 transition-colors duration-200 ${
                  halfHalf ? "text-yellow" : "text-muted"
                }`}
              />
              <div className="flex-1 text-left">
                <span
                  className={`block text-sm font-bold transition-colors duration-200 ${
                    halfHalf ? "text-cream" : "text-cream-dim"
                  }`}
                >
                  Meio a meio
                </span>
                <p className="text-[0.68rem] text-muted">
                  {halfHalf
                    ? "Dois sabores, preço do maior"
                    : "Toque para combinar dois sabores"}
                </p>
              </div>
              <div
                className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                  halfHalf ? "bg-yellow" : "bg-white/15"
                }`}
              >
                <div
                  className={`absolute top-0.5 size-4 rounded-full bg-black shadow transition-transform duration-200 ${
                    halfHalf ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>

            {/* Flavor 1 */}
            <div className="space-y-2">
              <label className="block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted">
                {showSecondFlavor ? "1ª metade" : "Sabor"}
              </label>
              <Select value={flavor1} onValueChange={handleFlavor1Change}>
                <SelectTrigger className="h-12 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {catPizzas.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Flavor 2 (only when half-half) */}
            <div
              className={`space-y-2 transition-all duration-300 ${
                showSecondFlavor
                  ? "max-h-[200px] opacity-100"
                  : "max-h-0 opacity-0 pointer-events-none overflow-hidden"
              }`}
            >
              <label className="block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-yellow/80">
                2ª metade
              </label>
              <Select value={flavor2} onValueChange={setFlavor2}>
                <SelectTrigger className="h-12 text-sm border-yellow/30 focus:border-yellow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {catPizzas.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Fixed bottom area */}
        <div className="shrink-0 border-t border-yellow/15 bg-linear-to-b from-black-light to-black px-5 py-4 sm:px-7 sm:py-5">
          <div className="mb-3 flex items-end justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">
                Total
              </span>
              <span className="text-[0.65rem] text-muted/70">
                {size} · {halfHalf ? "meio a meio" : "inteira"}
              </span>
            </div>
            <span className="font-body text-[1.8rem] font-bold leading-none text-yellow">
              <span className="text-base text-yellow/70 align-middle">R$ </span>
              {formatPrice(total)}
            </span>
          </div>
          <button
            onClick={handleAdd}
            type="button"
            className="group flex w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-[12px] bg-linear-to-r from-red-dark to-red-primary px-4 py-3.5 font-body text-sm font-bold text-cream shadow-md transition-all duration-200 hover:from-yellow hover:to-yellow-light hover:text-black active:scale-[0.98] sm:py-4"
          >
            <Plus className="size-5 transition-transform duration-200 group-active:scale-125" />
            Adicionar ao carrinho
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
