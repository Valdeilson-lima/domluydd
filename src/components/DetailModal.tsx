import { useState, useRef, useEffect } from "react";
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
import { PizzaVisualizer } from "./PizzaVisualizer";
import {
  SplitSquareHorizontal,
  Plus,
  Minus,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface DetailModalProps {
  pizza: Pizza | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: Omit<CartItem, "id" | "qty">, qty?: number) => void;
}

const SIZES = ["P", "M", "G"] as const;

const SIZE_META = {
  P: {
    fatias: 4,
    fatiasLabel: "4 fatias",
    pessoas: "1 pessoa",
    badge: "Individual",
    cor: "#d90416",
  },
  M: {
    fatias: 6,
    fatiasLabel: "6 fatias",
    pessoas: "2 a 3 pessoas",
    badge: "Mais pedida",
    cor: "#f28705",
  },
  G: {
    fatias: 8,
    fatiasLabel: "8 fatias",
    pessoas: "3 a 4 pessoas",
    badge: "Família",
    cor: "#f2b705",
  },
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
  const [observation, setObservation] = useState("");
  const [qty, setQty] = useState(1);

  const flavor2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (halfHalf && flavor2Ref.current) {
      const t = setTimeout(() => {
        flavor2Ref.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 250);
      return () => clearTimeout(t);
    }
  }, [halfHalf]);

  if (!pizza) return null;

  const catPizzas = pizza.category === "doce" ? doces : salgadas;
  const showSecondFlavor = halfHalf;

  const getPrice = (name: string, s: string) => {
    const p = getPizzaByName(name);
    if (!p) return 0;
    return p[s.toLowerCase() as "p" | "m" | "g"] || 0;
  };

  const price1 = getPrice(flavor1, size);
  const price2 = getPrice(flavor2, size);
  const unitPrice = Math.max(price1, price2);
  const totalPrice = unitPrice * qty;

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
    onAddToCart(
      {
        flavors: halfHalf
          ? [
              { name: flavor1, price: price1 },
              { name: flavor2, price: price2 },
            ]
          : [{ name: flavor1, price: price1 }],
        size,
        price: unitPrice,
        category: catLabel,
        observation: observation.trim() || undefined,
      },
      qty
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-yellow/20 bg-linear-to-b from-[#1c191a] to-[#121011] shadow-[0_24px_64px_rgba(0,0,0,0.85)]">
        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Header Title Bar */}
          <div className="relative border-b border-white/6 px-5 pt-5 pb-3 text-center sm:px-6">
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.25em] text-yellow/85">
              {pizza.category === "doce"
                ? "Pizza Doce Especial"
                : "Pizza Artesanal Salgada"}
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold italic tracking-[-0.02em] text-cream [font-variation-settings:'opsz'_144,'SOFT'_40] sm:text-3xl">
              {pizza.name}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted/90 sm:text-sm">
              {pizza.desc}
            </p>
          </div>

          {/* Interactive Visualizer Signature Element */}
          <div className="border-b border-white/6 bg-black/40">
            <PizzaVisualizer
              flavor1={flavor1}
              flavor2={flavor2}
              isHalfHalf={halfHalf}
              size={size}
              category={pizza.category}
            />
          </div>

          {/* Configuration Sections */}
          <div className="space-y-5 p-5 sm:p-6">
            {/* 1. Escolha o Tamanho */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                  1. Escolha o Tamanho
                </label>
                <span className="text-[0.65rem] font-medium text-muted">
                  Massa de fermentação natural
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {SIZES.map((s) => {
                  const p1 = getPrice(flavor1, s);
                  const p2 = getPrice(flavor2, s);
                  const maxP = Math.max(p1, p2);
                  const active = size === s;
                  const meta = SIZE_META[s];

                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      type="button"
                      className={`relative flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all duration-200 cursor-pointer ${
                        active
                          ? "border-yellow bg-yellow/12 shadow-[0_0_16px_rgba(242,183,5,0.2),inset_0_0_0_1px_rgba(242,183,5,0.5)] scale-[1.02]"
                          : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4"
                      }`}
                    >
                      {/* Popular badge */}
                      {s === "M" && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-yellow px-1.5 py-0.2 font-mono text-[0.5rem] font-bold uppercase tracking-wider text-black">
                          Popular
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: meta.cor }}
                        />
                        <span
                          className={`font-display text-lg font-bold leading-none ${
                            active ? "text-yellow" : "text-cream"
                          }`}
                        >
                          {s}
                        </span>
                      </div>

                      <span className="mt-1 font-mono text-xs font-bold text-cream">
                        R$ {formatPrice(maxP)}
                      </span>

                      <div className="mt-1 text-[0.62rem] text-muted">
                        <span className="block leading-tight font-medium">
                          {meta.fatiasLabel}
                        </span>
                        <span className="block leading-tight text-[0.55rem] text-muted/70">
                          {meta.pessoas}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Meio a Meio Toggle */}
            <div className="rounded-xl border border-white/8 bg-white/2 p-3.5 transition-all duration-200 hover:border-white/15">
              <button
                type="button"
                onClick={handleToggleHalf}
                className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      halfHalf
                        ? "border-yellow/50 bg-yellow/15 text-yellow"
                        : "border-white/10 bg-white/5 text-muted"
                    }`}
                  >
                    <SplitSquareHorizontal className="size-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-cream">
                      Dividir pizza meio a meio?
                    </span>
                    <span className="block text-xs text-muted">
                      {halfHalf
                        ? "Você paga o valor do sabor mais caro"
                        : "Toque para escolher dois sabores diferentes"}
                    </span>
                  </div>
                </div>

                {/* Switch toggle */}
                <div
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 shrink-0 ${
                    halfHalf ? "bg-yellow" : "bg-white/15"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 size-5 rounded-full bg-black shadow-md transition-transform duration-200 ${
                      halfHalf ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* 3. Seleção de Sabores */}
            <div className="space-y-3">
              {/* Sabor 1 */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                  <span>
                    {showSecondFlavor ? "1ª Metade" : "Sabor da Pizza"}
                  </span>
                  <span className="font-mono text-yellow font-normal">
                    R$ {formatPrice(price1)}
                  </span>
                </label>
                <Select value={flavor1} onValueChange={handleFlavor1Change}>
                  <SelectTrigger className="h-12 rounded-xl border-white/10 bg-black/60 text-sm font-medium text-cream focus:border-yellow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 border-yellow/20 bg-[#1c191a] text-cream">
                    {catPizzas.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.name}
                        className="py-2.5 focus:bg-yellow/15 focus:text-cream cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-medium">{p.name}</span>
                          <span className="font-mono text-xs text-muted">
                            R${" "}
                            {formatPrice(
                              p[size.toLowerCase() as "p" | "m" | "g"]
                            )}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sabor 2 (Meio a Meio) */}
              {showSecondFlavor && (
                <div
                  ref={flavor2Ref}
                  className="space-y-1.5 animate-[fadeUp_0.25s_ease]"
                >
                  <label className="flex items-center justify-between font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-yellow">
                    <span>2ª Metade</span>
                    <span className="font-mono text-yellow font-normal">
                      R$ {formatPrice(price2)}
                    </span>
                  </label>
                  <Select value={flavor2} onValueChange={setFlavor2}>
                    <SelectTrigger className="h-12 rounded-xl border-yellow/40 bg-black/60 text-sm font-medium text-cream focus:border-yellow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 border-yellow/20 bg-[#1c191a] text-cream">
                      {catPizzas.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.name}
                          className="py-2.5 focus:bg-yellow/15 focus:text-cream cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="font-medium">{p.name}</span>
                            <span className="font-mono text-xs text-muted">
                              R${" "}
                              {formatPrice(
                                p[size.toLowerCase() as "p" | "m" | "g"]
                              )}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[0.68rem] text-muted flex items-center gap-1 pt-0.5">
                    <Sparkles className="size-3 text-yellow" />
                    Valor final baseado na metade de maior valor (R${" "}
                    {formatPrice(unitPrice)})
                  </p>
                </div>
              )}
            </div>

            {/* 4. Observações para a cozinha */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                <MessageSquare className="size-3 text-muted" />
                Observações do pedido (opcional)
              </label>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ex: sem cebola, massa bem assada, pouco orégano..."
                rows={2}
                maxLength={140}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 font-body text-xs text-cream outline-none transition-colors duration-200 placeholder:text-muted/60 focus:border-yellow/60 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 border-t border-yellow/20 bg-linear-to-b from-[#1a1718] to-[#121011] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted">
                Preço final
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-yellow sm:text-3xl">
                  R$ {formatPrice(totalPrice)}
                </span>
                <span className="text-[0.65rem] text-muted">
                  ({size} · {halfHalf ? "2 sabores" : "inteira"})
                </span>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 p-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-cream-dim transition-colors hover:bg-white/10 hover:text-yellow disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Diminuir quantidade"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-6 text-center font-mono text-sm font-bold text-cream">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-cream-dim transition-colors hover:bg-white/10 hover:text-yellow"
                aria-label="Aumentar quantidade"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-red-dark via-red-primary to-yellow px-5 py-3.5 font-body text-sm font-bold text-cream shadow-[0_8px_24px_rgba(217,4,22,0.35)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-5" />
            Adicionar {qty > 1 ? `${qty} pizzas` : "ao pedido"} · R${" "}
            {formatPrice(totalPrice)}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
