import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PizzaVisualizer } from "./PizzaVisualizer";
import { formatPrice } from "@/lib/utils";
import { getPizzaByName, MODAL_IMAGES, salgadas, doces } from "@/data/pizzas";
import type { Pizza, CartItem } from "@/types";
import { ShoppingBag, SplitSquareHorizontal } from "lucide-react";

interface DetailModalProps {
  pizza: Pizza | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: Omit<CartItem, "id">) => void;
}

const SIZES = ["P", "M", "G"] as const;

const SIZE_META = {
  P: { fatias: 4, cor: "#c73b2a" },
  M: { fatias: 6, cor: "#d4a54a" },
  G: { fatias: 8, cor: "#3d7a4a" },
} as const;

export function DetailModal({
  pizza,
  open,
  onOpenChange,
  onAddToCart,
}: DetailModalProps) {
  const initialFlavor = pizza?.name ?? "";
  const [size, setSize] = useState("M");
  const [flavor1, setFlavor1] = useState(initialFlavor);
  const [flavor2, setFlavor2] = useState(initialFlavor);
  const [halfHalf, setHalfHalf] = useState(false);

  if (!pizza) return null;

  const catPizzas = pizza.category === "doce" ? doces : salgadas;
  const isHalf = halfHalf && flavor1 !== flavor2;
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
      <DialogContent className="max-w-[560px] max-h-[90vh] p-0 gap-0 flex flex-col">
        {/* Scrollable area */}
        <div className="overflow-y-auto flex-1">
          <div className="aspect-[16/9] w-full overflow-hidden bg-black shrink-0">
            <img
              src={MODAL_IMAGES[pizza.imgIdx]}
              alt={pizza.name}
              className="size-full object-cover"
            />
          </div>

          <div className="px-5 pt-5 pb-4 sm:px-7 sm:pt-7 sm:pb-5 space-y-5">
            <div>
              <h2 className="font-display text-xl font-extrabold text-yellow sm:text-[1.6rem]">
                {pizza.name}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {pizza.desc}
              </p>
            </div>

            {/* Size Selector — pill-style circles */}
            <div className="space-y-3">
              <label className="block text-[0.75rem] font-semibold uppercase tracking-[0.5px] text-muted/80">
                Tamanho
              </label>
              <div className="flex gap-3">
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
                      className={`relative flex-1 rounded-[14px] border-2 px-3 py-3.5 text-center transition-all duration-200 cursor-pointer ${
                        active
                          ? "border-red-primary bg-red-primary/12 shadow-[0_0_0_1px_rgba(196,30,36,0.3)]"
                          : "border-white/8 bg-white/[0.03] hover:border-white/20"
                      }`}
                    >
                      {/* Size dot indicator */}
                      <span
                        className="mx-auto mb-1.5 block size-3 rounded-full sm:size-3.5"
                        style={{ background: meta.cor }}
                      />
                      <span
                        className={`block text-sm font-extrabold leading-tight ${active ? "text-red-primary" : "text-white"}`}
                      >
                        {s}
                      </span>
                      <span
                        className={`block font-mono text-[0.7rem] font-semibold ${active ? "text-red-primary" : "text-muted"}`}
                      >
                        R$ {formatPrice(maxP)}
                      </span>
                      <span className="mt-0.5 block text-[0.55rem] text-muted/50">
                        {meta.fatias} fatias
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Half-half toggle */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleToggleHalf}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-[12px] border-2 px-4 py-3 transition-all duration-200 ${
                  halfHalf
                    ? "border-red-primary bg-red-primary/8"
                    : "border-white/8 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <SplitSquareHorizontal
                  className={`size-5 transition-colors duration-200 ${halfHalf ? "text-red-primary" : "text-muted"}`}
                />
                <div className="flex-1 text-left">
                  <span
                    className={`text-sm font-bold transition-colors duration-200 ${halfHalf ? "text-white" : "text-muted"}`}
                  >
                    Meio a meio
                  </span>
                  <p className="text-[0.65rem] text-muted/60">
                    Escolha dois sabores diferentes
                  </p>
                </div>
                <div
                  className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                    halfHalf ? "bg-red-primary" : "bg-white/15"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      halfHalf ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Flavor 1 */}
            <div className="space-y-2">
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.5px] text-muted/80">
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
              <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.5px] text-red-primary/80">
                2ª metade
              </label>
              <Select value={flavor2} onValueChange={setFlavor2}>
                <SelectTrigger className="h-12 text-sm border-red-primary/30 focus:border-red-primary">
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

            {/* Pizza Visualizer */}
            <PizzaVisualizer
              flavor1={flavor1}
              flavor2={flavor2}
              isHalf={isHalf}
            />
          </div>
        </div>

        {/* Fixed bottom area: total + add button */}
        <div className="shrink-0 border-t border-white/8 bg-black-light px-5 py-4 sm:px-7 sm:py-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted">
              Total do pedido
            </span>
            <span className="font-mono text-xl font-bold text-yellow-light sm:text-2xl">
              R$ {formatPrice(total)}
            </span>
          </div>
          <button
            onClick={handleAdd}
            type="button"
            className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[10px] bg-gradient-to-r from-red-primary to-red-dark px-4 py-3 font-body text-xs font-bold text-white shadow-md transition-all duration-200 hover:from-yellow hover:to-yellow-light hover:text-black active:scale-[0.97] sm:gap-2.5 sm:py-4 sm:text-sm"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-white/15" />
            <ShoppingBag className="size-4 transition-transform duration-200 group-active:scale-125 sm:size-5" />
            Adicionar ao carrinho
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
