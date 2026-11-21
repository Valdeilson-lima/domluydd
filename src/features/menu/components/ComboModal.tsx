"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, roundCurrency } from "@/lib/utils";
import type { CartItem, Combo, Pizza } from "@/types";

interface ComboModalProps {
  combo: Combo | null;
  pizzas?: Pizza[];
  onClose: () => void;
  isPaused: (name: string) => boolean;
  onAddToCart: (item: Omit<CartItem, "id" | "qty"> & { qty: number }) => void;
}

interface SlotSelection {
  isHalf: boolean;
  firstFlavor: string;
  secondFlavor: string;
}

function ComboConfiguratorForm({
  combo,
  salgadas,
  doces,
  isPaused,
  onConfirm,
}: {
  combo: Combo;
  salgadas: Pizza[];
  doces: Pizza[];
  isPaused: (name: string) => boolean;
  onConfirm: (item: Omit<CartItem, "id" | "qty"> & { qty: number }) => void;
}) {
  const availableSalgadas = useMemo(
    () => salgadas.filter((p) => p.available !== false && !isPaused(p.name)),
    [salgadas, isPaused]
  );
  const availableDoces = useMemo(
    () => doces.filter((p) => p.available !== false && !isPaused(p.name)),
    [doces, isPaused]
  );

  const [slots, setSlots] = useState<SlotSelection[]>(() =>
    combo.pizzaSlots.map((slot, idx) => {
      const pool =
        slot.category === "doce"
          ? availableDoces.length > 0
            ? availableDoces
            : doces
          : availableSalgadas.length > 0
            ? availableSalgadas
            : salgadas;
      const first =
        pool[idx % pool.length]?.name ?? pool[0]?.name ?? "Calabresa";
      const second =
        pool[(idx + 1) % pool.length]?.name ?? pool[0]?.name ?? first;
      return { isHalf: false, firstFlavor: first, secondFlavor: second };
    })
  );

  const [drinks, setDrinks] = useState<string[]>(() =>
    (combo.drinkSlots ?? []).map(
      (slot, idx) => slot.options[idx % slot.options.length] ?? slot.options[0]
    )
  );
  const [extraNote, setExtraNote] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const savings = roundCurrency(combo.originalPrice - combo.price);

  const updateSlot = (index: number, patch: Partial<SlotSelection>) => {
    setError(null);
    setSlots((prev) =>
      prev.map((slot, idx) => (idx === index ? { ...slot, ...patch } : slot))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const summaryParts: string[] = [];

    for (let i = 0; i < combo.pizzaSlots.length; i++) {
      const def = combo.pizzaSlots[i];
      const sel = slots[i];
      if (!sel?.firstFlavor) {
        setError(`Escolha o sabor para ${def.label}.`);
        return;
      }
      if (isPaused(sel.firstFlavor)) {
        setError(
          `O sabor "${sel.firstFlavor}" está pausado. Selecione outro sabor.`
        );
        return;
      }
      if (def.allowHalf && sel.isHalf) {
        if (!sel.secondFlavor || sel.secondFlavor === sel.firstFlavor) {
          setError(`Escolha um segundo sabor diferente para ${def.label}.`);
          return;
        }
        if (isPaused(sel.secondFlavor)) {
          setError(
            `O sabor "${sel.secondFlavor}" está pausado. Selecione outro sabor.`
          );
          return;
        }
        summaryParts.push(
          `${def.label}: ½ ${sel.firstFlavor} + ½ ${sel.secondFlavor}`
        );
      } else {
        summaryParts.push(`${def.label}: ${sel.firstFlavor}`);
      }
    }

    if (combo.drinkSlots && combo.drinkSlots.length > 0) {
      summaryParts.push(`Bebidas: ${drinks.join(" + ")}`);
    } else if (combo.fixedDrinkLabel) {
      summaryParts.push(`Bebida: ${combo.fixedDrinkLabel}`);
    }

    if (extraNote.trim()) {
      summaryParts.push(`Obs.: ${extraNote.trim()}`);
    }

    onConfirm({
      category: "combo",
      size: "Combo",
      flavors: [{ name: combo.name, price: combo.price }],
      price: combo.price,
      qty,
      observation: summaryParts.join(" · ").slice(0, 360),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/70 px-3.5 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-foreground">
          {combo.items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 font-medium"
            >
              <Check className="size-3.5 text-status-open" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
        {savings > 0 && (
          <span className="rounded-full bg-accent-gold-soft px-2.5 py-0.5 font-semibold text-accent-gold-ink tabular-nums">
            Economize R$ {formatPrice(savings)}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {combo.pizzaSlots.map((slotDef, idx) => {
          const sel = slots[idx];
          const pool = slotDef.category === "doce" ? doces : salgadas;
          return (
            <fieldset
              key={slotDef.label}
              className="space-y-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <legend className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {slotDef.label}
                </legend>
                {slotDef.allowHalf && (
                  <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
                    <button
                      type="button"
                      aria-pressed={!sel.isHalf}
                      onClick={() => updateSlot(idx, { isHalf: false })}
                      className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                        !sel.isHalf
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Inteira
                    </button>
                    <button
                      type="button"
                      aria-pressed={sel.isHalf}
                      onClick={() => {
                        const alt =
                          pool.find(
                            (p) =>
                              p.name !== sel.firstFlavor && !isPaused(p.name)
                          )?.name ?? sel.secondFlavor;
                        updateSlot(idx, { isHalf: true, secondFlavor: alt });
                      }}
                      className={`min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                        sel.isHalf
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Meio a Meio
                    </button>
                  </div>
                )}
              </div>

              <div
                className={`grid gap-3 ${sel.isHalf ? "sm:grid-cols-2" : "grid-cols-1"}`}
              >
                <div className="space-y-1">
                  <label
                    htmlFor={`combo-${combo.id}-slot-${idx}-a`}
                    className="block text-xs font-medium text-muted-foreground"
                  >
                    {sel.isHalf ? "1ª metade" : "Escolha o sabor"}
                  </label>
                  <select
                    id={`combo-${combo.id}-slot-${idx}-a`}
                    value={sel.firstFlavor}
                    onChange={(e) =>
                      updateSlot(idx, { firstFlavor: e.target.value })
                    }
                    className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {pool.map((p) => {
                      const paused = isPaused(p.name);
                      return (
                        <option key={p.id} value={p.name} disabled={paused}>
                          {p.name}
                          {paused ? " (Indisponível)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {sel.isHalf && (
                  <div className="space-y-1">
                    <label
                      htmlFor={`combo-${combo.id}-slot-${idx}-b`}
                      className="block text-xs font-medium text-muted-foreground"
                    >
                      2ª metade
                    </label>
                    <select
                      id={`combo-${combo.id}-slot-${idx}-b`}
                      value={sel.secondFlavor}
                      onChange={(e) =>
                        updateSlot(idx, { secondFlavor: e.target.value })
                      }
                      className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                    >
                      {pool
                        .filter((p) => p.name !== sel.firstFlavor)
                        .map((p) => {
                          const paused = isPaused(p.name);
                          return (
                            <option key={p.id} value={p.name} disabled={paused}>
                              {p.name}
                              {paused ? " (Indisponível)" : ""}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                )}
              </div>
            </fieldset>
          );
        })}

        {combo.drinkSlots && combo.drinkSlots.length > 0 && (
          <fieldset className="space-y-3 rounded-xl border border-border bg-card p-4">
            <legend className="text-xs font-bold uppercase tracking-wider text-foreground">
              Refrigerantes inclusos
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {combo.drinkSlots.map((drinkSlot, idx) => (
                <div key={drinkSlot.label} className="space-y-1">
                  <label
                    htmlFor={`combo-${combo.id}-drink-${idx}`}
                    className="block text-xs font-medium text-muted-foreground"
                  >
                    {drinkSlot.label}
                  </label>
                  <select
                    id={`combo-${combo.id}-drink-${idx}`}
                    value={drinks[idx] ?? drinkSlot.options[0]}
                    onChange={(e) =>
                      setDrinks((prev) =>
                        prev.map((d, i) => (i === idx ? e.target.value : d))
                      )
                    }
                    className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {drinkSlot.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor={`combo-obs-${combo.id}`}
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Observações para a cozinha (opcional)
          </label>
          <input
            id={`combo-obs-${combo.id}`}
            type="text"
            maxLength={100}
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            placeholder="Ex.: sem cebola na Calabresa, bem assada…"
            className="min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div
          className="flex items-center overflow-hidden rounded-lg border border-border bg-card"
          aria-label="Quantidade do combo"
        >
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex size-11 items-center justify-center text-base font-bold text-foreground transition-colors hover:bg-secondary"
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-bold tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            className="flex size-11 items-center justify-center text-base font-bold text-foreground transition-colors hover:bg-secondary"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>

        <button
          type="submit"
          className="min-h-11 flex-1 min-w-[210px] rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.985]"
        >
          Adicionar combo · R$ {formatPrice(combo.price * qty)}
        </button>
      </div>
    </form>
  );
}

export function ComboModal({
  combo,
  pizzas,
  onClose,
  isPaused,
  onAddToCart,
}: ComboModalProps) {
  const salgadasList = useMemo(
    () => (pizzas ? pizzas.filter((p) => p.category === "salgada") : []),
    [pizzas]
  );
  const docesList = useMemo(
    () => (pizzas ? pizzas.filter((p) => p.category === "doce") : []),
    [pizzas]
  );

  return (
    <Dialog open={Boolean(combo)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        {combo && (
          <>
            <DialogHeader>
              <DialogTitle>{combo.name}</DialogTitle>
              <DialogDescription>{combo.desc}</DialogDescription>
            </DialogHeader>
            <ComboConfiguratorForm
              key={combo.id}
              combo={combo}
              salgadas={salgadasList}
              doces={docesList}
              isPaused={isPaused}
              onConfirm={(item) => {
                onAddToCart(item);
                onClose();
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
