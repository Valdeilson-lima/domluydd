"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import {
  getPizzaByName,
  salgadas,
  doces,
  CRUST_OPTIONS,
  EXTRA_INGREDIENTS,
  COMMON_REMOVALS,
} from "@/data/pizzas";
import type {
  Pizza,
  Drink,
  CartItem,
  CrustOption,
  ExtraIngredient,
} from "@/types";
import { PizzaVisualizer } from "./PizzaVisualizer";
import {
  SplitSquareHorizontal,
  Plus,
  Minus,
  MessageSquare,
  Sparkles,
  Share2,
  Check,
} from "lucide-react";
import { showToast } from "@/components/ui/toast-helpers";

interface DetailModalProps {
  pizza: Pizza | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: Omit<CartItem, "id" | "qty">, qty?: number) => void;
  onAddDrink?: (drink: Drink) => void;
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
  const [selectedCrust, setSelectedCrust] = useState<CrustOption>(
    CRUST_OPTIONS[0]
  );
  const [selectedExtras, setSelectedExtras] = useState<ExtraIngredient[]>([]);
  const [selectedRemovals, setSelectedRemovals] = useState<string[]>([]);
  const [observation, setObservation] = useState("");
  const [qty, setQty] = useState(1);

  const flavor2Ref = useRef<HTMLDivElement>(null);

  const resetForm = useCallback(() => {
    setSize("M");
    setHalfHalf(false);
    setSelectedCrust(CRUST_OPTIONS[0]);
    setSelectedExtras([]);
    setSelectedRemovals([]);
    setObservation("");
    setQty(1);
    if (pizza) {
      setFlavor1(pizza.name);
      setFlavor2(pizza.name);
    }
  }, [pizza]);

  useEffect(() => {
    if (open && pizza) {
      resetForm();
    }
  }, [open, pizza, resetForm]);

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
  const basePizzaPrice = Math.max(price1, price2);
  const crustPrice = selectedCrust.price;
  const extrasPrice = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const unitPrice = basePizzaPrice + crustPrice + extrasPrice;
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

  const toggleExtra = (extra: ExtraIngredient) => {
    setSelectedExtras((prev) =>
      prev.some((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const toggleRemoval = (removal: string) => {
    setSelectedRemovals((prev) =>
      prev.includes(removal)
        ? prev.filter((r) => r !== removal)
        : [...prev, removal]
    );
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/pizza/${pizza.slug}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showToast("Link copiado para a área de transferência!");
    } else {
      showToast(url);
    }
  };

  const handleAdd = () => {
    const catLabel = pizza.category === "doce" ? "Pizza Doce" : "Pizza Salgada";
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
        crust: selectedCrust.price > 0 ? selectedCrust : undefined,
        extras: selectedExtras.length > 0 ? selectedExtras : undefined,
        removals: selectedRemovals.length > 0 ? selectedRemovals : undefined,
      },
      qty
    );
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] p-0 gap-0 flex flex-col overflow-hidden rounded-sm border border-yellow/20 bg-linear-to-b from-[#1c191a] to-[#121011] shadow-[0_24px_64px_rgba(0,0,0,0.85)]">
        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Header Title Bar */}
          <div className="relative border-b border-white/6 px-5 pt-5 pb-3 text-center sm:px-6">
            <button
              type="button"
              onClick={handleShare}
              title="Compartilhar sabor"
              className="absolute left-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-sm border border-white/10 bg-white/4 text-muted transition-colors hover:border-yellow hover:text-yellow"
            >
              <Share2 className="size-4" />
            </button>

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
          <div className="space-y-6 p-5 sm:p-6">
            {/* 1. Escolha o Tamanho */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                  1. Escolha o Tamanho
                </label>
                <span className="text-[0.65rem] font-medium text-muted">
                  Fermentação natural de 48h
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
                      className={`relative flex flex-col items-center justify-between rounded-sm border p-2.5 text-center transition-all duration-200 cursor-pointer ${
                        active
                          ? "border-yellow bg-yellow/12 shadow-[0_0_16px_rgba(242,183,5,0.2),inset_0_0_0_1px_rgba(242,183,5,0.5)] scale-[1.02]"
                          : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4"
                      }`}
                    >
                      {s === "M" && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-sm bg-yellow px-1.5 py-0.2 font-mono text-[0.5rem] font-bold uppercase tracking-wider text-black">
                          Popular
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-sm"
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
            <div className="rounded-sm border border-white/8 bg-white/2 p-3.5 transition-all duration-200 hover:border-white/15">
              <button
                type="button"
                onClick={handleToggleHalf}
                className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-sm border transition-colors ${
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

                <div
                  className={`relative h-6 w-11 rounded-sm border border-white/20 transition-colors duration-200 shrink-0 ${
                    halfHalf ? "bg-yellow" : "bg-black/60"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 size-4.5 rounded-sm bg-black shadow-md transition-transform duration-200 ${
                      halfHalf
                        ? "translate-x-5.5 bg-black"
                        : "translate-x-0.5 bg-white/60"
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* 3. Seleção de Sabores */}
            <div className="space-y-3">
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
                  <SelectTrigger className="h-12 rounded-sm border-white/10 bg-black/60 text-sm font-medium text-cream focus:border-yellow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 rounded-sm border-yellow/20 bg-[#1c191a] text-cream">
                    {catPizzas.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={p.name}
                        disabled={p.available === false}
                        className="py-2.5 focus:bg-yellow/15 focus:text-cream cursor-pointer disabled:opacity-40"
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-medium">
                            {p.name} {p.available === false && "(Esgotado)"}
                          </span>
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
                    <SelectTrigger className="h-12 rounded-sm border-yellow/40 bg-black/60 text-sm font-medium text-cream focus:border-yellow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 rounded-sm border-yellow/20 bg-[#1c191a] text-cream">
                      {catPizzas.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.name}
                          disabled={p.available === false}
                          className="py-2.5 focus:bg-yellow/15 focus:text-cream cursor-pointer disabled:opacity-40"
                        >
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span className="font-medium">
                              {p.name} {p.available === false && "(Esgotado)"}
                            </span>
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
                    {formatPrice(basePizzaPrice)})
                  </p>
                </div>
              )}
            </div>

            {/* 4. Bordas Recheadas (Ticket Médio) */}
            <div className="space-y-2.5">
              <label className="flex items-center justify-between font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                <span>2. Borda Recheada</span>
                <span className="text-[0.65rem] text-muted">Opcional</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CRUST_OPTIONS.map((crust) => {
                  const isSelected = selectedCrust.id === crust.id;
                  return (
                    <button
                      key={crust.id}
                      type="button"
                      onClick={() => setSelectedCrust(crust)}
                      className={`flex items-center justify-between p-2.5 rounded-sm border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-yellow bg-yellow/15 text-yellow shadow-sm"
                          : "border-white/8 bg-white/2 text-cream hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-4 rounded-sm border flex items-center justify-center ${
                            isSelected
                              ? "border-yellow bg-yellow text-black"
                              : "border-white/20"
                          }`}
                        >
                          {isSelected && (
                            <Check className="size-2.5 stroke-3" />
                          )}
                        </div>
                        <span className="text-xs font-medium">
                          {crust.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold shrink-0">
                        {crust.price === 0
                          ? "Grátis"
                          : `+ R$ ${formatPrice(crust.price)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Ingredientes Extras (Adicionais) */}
            <div className="space-y-2.5">
              <label className="flex items-center justify-between font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                <span>3. Adicionais Extras</span>
                <span className="text-[0.65rem] text-muted">
                  Turbine sua pizza
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXTRA_INGREDIENTS.map((extra) => {
                  const isSelected = selectedExtras.some(
                    (e) => e.id === extra.id
                  );
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`flex items-center justify-between p-2.5 rounded-sm border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-yellow bg-yellow/15 text-yellow shadow-sm"
                          : "border-white/8 bg-white/2 text-cream hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-4 rounded-sm border flex items-center justify-center ${
                            isSelected
                              ? "border-yellow bg-yellow text-black"
                              : "border-white/20"
                          }`}
                        >
                          {isSelected && (
                            <Check className="size-2.5 stroke-3" />
                          )}
                        </div>
                        <span className="text-xs font-medium">
                          {extra.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold shrink-0">
                        + R$ {formatPrice(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Remover Ingredientes Padrão */}
            <div className="space-y-2">
              <label className="flex items-center justify-between font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                <span>4. Não gosta de algum ingrediente?</span>
                <span className="text-[0.65rem] text-muted">
                  Toque para remover
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_REMOVALS.map((rem) => {
                  const isRemoved = selectedRemovals.includes(rem);
                  return (
                    <button
                      key={rem}
                      type="button"
                      onClick={() => toggleRemoval(rem)}
                      className={`px-3 py-1.5 rounded-sm border text-xs font-medium transition-all cursor-pointer ${
                        isRemoved
                          ? "border-red-primary bg-red-primary/20 text-red-light line-through"
                          : "border-white/10 bg-white/3 text-muted hover:text-cream hover:border-white/20"
                      }`}
                    >
                      {rem}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Observações para a cozinha */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                <MessageSquare className="size-3 text-muted" />
                Outras observações (opcional)
              </label>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ex: massa bem passada, cortar em aperitivo, caprichar no orégano..."
                rows={2}
                maxLength={140}
                className="w-full resize-none rounded-sm border border-white/10 bg-black/60 px-3.5 py-2.5 font-body text-xs text-cream outline-none transition-colors duration-200 placeholder:text-muted/60 focus:border-yellow/60 leading-relaxed"
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
            <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-black/60 p-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="flex size-9 cursor-pointer items-center justify-center rounded-sm text-cream-dim transition-colors hover:bg-white/10 hover:text-yellow disabled:opacity-30 disabled:cursor-not-allowed"
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
                className="flex size-9 cursor-pointer items-center justify-center rounded-sm text-cream-dim transition-colors hover:bg-white/10 hover:text-yellow"
                aria-label="Aumentar quantidade"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-linear-to-r from-red-dark via-red-primary to-yellow px-5 py-3.5 font-body text-sm font-bold text-cream shadow-[0_8px_24px_rgba(217,4,22,0.35)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
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
