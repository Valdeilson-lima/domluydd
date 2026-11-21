"use client";

import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { PizzaVisualizer } from "@/features/menu/components/PizzaVisualizer";
import { PizzaImage } from "@/features/menu/components/PizzaImage";
import { getRemovalsForCategory } from "@/lib/catalog";
import {
  calculatePizzaUnitPrice,
  getPizzaSizePrice,
  type PizzaSizeKey,
} from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import type { CartItem, CrustOption, ExtraIngredient, Pizza } from "@/types";

interface PizzaConfiguratorProps {
  pizza: Pizza;
  allPizzas?: Pizza[];
  crusts?: CrustOption[];
  extras?: ExtraIngredient[];
  commonRemovals?: string[];
  sweetRemovals?: string[];
  isPaused: (name: string) => boolean;
  onConfirm: (item: Omit<CartItem, "id" | "qty"> & { qty: number }) => void;
  initialSize?: PizzaSizeKey;
  initialHalf?: boolean;
  showHeaderPreview?: boolean;
}

const SIZES: Array<{ key: PizzaSizeKey; label: string; slices: string }> = [
  { key: "p", label: "P", slices: "4 fatias" },
  { key: "m", label: "M", slices: "6 fatias" },
  { key: "g", label: "G", slices: "8 fatias" },
];

export function PizzaConfigurator({
  pizza,
  allPizzas = [],
  crusts = [],
  extras = [],
  commonRemovals,
  sweetRemovals,
  isPaused,
  onConfirm,
  initialSize = "m",
  initialHalf = false,
  showHeaderPreview = false,
}: PizzaConfiguratorProps) {
  const sameCategoryPeers = useMemo(
    () =>
      allPizzas.filter(
        (candidate) =>
          candidate.category === pizza.category && candidate.name !== pizza.name
      ),
    [allPizzas, pizza.category, pizza.name]
  );

  const firstAvailablePeer = useMemo(
    () =>
      sameCategoryPeers.find((p) => p.available !== false && !isPaused(p.name))
        ?.name ??
      sameCategoryPeers[0]?.name ??
      "",
    [sameCategoryPeers, isPaused]
  );

  const crustOptions = useMemo(
    () =>
      crusts.filter(
        (c) =>
          c.available !== false && c.compatibleWith.includes(pizza.category)
      ),
    [crusts, pizza.category]
  );
  const extraOptions = useMemo(
    () =>
      extras.filter(
        (e) =>
          e.available !== false && e.compatibleWith.includes(pizza.category)
      ),
    [extras, pizza.category]
  );
  const removalOptions = useMemo(() => {
    if (pizza.category === "doce" && Array.isArray(sweetRemovals)) {
      return sweetRemovals;
    }
    if (pizza.category === "salgada" && Array.isArray(commonRemovals)) {
      return commonRemovals;
    }
    return getRemovalsForCategory(pizza.category);
  }, [pizza.category, commonRemovals, sweetRemovals]);

  const resolvedInitialSize: PizzaSizeKey =
    initialHalf && initialSize === "p" ? "m" : initialSize;

  const [size, setSize] = useState<PizzaSizeKey>(resolvedInitialSize);
  const [isHalf, setIsHalf] = useState(initialHalf);
  const [secondFlavorName, setSecondFlavorName] = useState(firstAvailablePeer);
  const [crustId, setCrustId] = useState(crustOptions[0]?.id ?? "sem-borda");
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [selectedRemovals, setSelectedRemovals] = useState<string[]>([]);
  const [observation, setObservation] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const primaryPaused = isPaused(pizza.name);
  const secondPizza = useMemo(
    () =>
      isHalf
        ? (sameCategoryPeers.find((p) => p.name === secondFlavorName) ?? null)
        : null,
    [isHalf, sameCategoryPeers, secondFlavorName]
  );

  const selectedCrust = useMemo(
    () => crustOptions.find((c) => c.id === crustId) ?? crustOptions[0],
    [crustOptions, crustId]
  );

  const selectedExtras = useMemo(
    () => extraOptions.filter((e) => selectedExtraIds.includes(e.id)),
    [extraOptions, selectedExtraIds]
  );

  const flavors = useMemo(() => {
    if (isHalf && secondPizza) return [pizza, secondPizza];
    return [pizza];
  }, [pizza, isHalf, secondPizza]);

  const unitPrice = calculatePizzaUnitPrice({
    flavors,
    size,
    crustPrice: selectedCrust?.price ?? 0,
    extrasPrices: selectedExtras.map((e) => e.price),
  });

  const handleToggleHalf = (halfMode: boolean) => {
    setError(null);
    setIsHalf(halfMode);
    if (halfMode) {
      if (size === "p") {
        setSize("m");
      }
      if (!secondFlavorName || isPaused(secondFlavorName)) {
        const nextAvail = sameCategoryPeers.find((p) => !isPaused(p.name));
        if (nextAvail) setSecondFlavorName(nextAvail.name);
      }
    }
  };

  const toggleExtra = (id: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleRemoval = (label: string) => {
    setSelectedRemovals((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (primaryPaused) {
      setError(`O sabor ${pizza.name} está pausado pela cozinha no momento.`);
      return;
    }

    if (isHalf) {
      if (size === "p") {
        setError("Opção meio a meio disponível apenas nos tamanhos M ou G.");
        return;
      }
      if (!secondPizza) {
        setError("Selecione o segundo sabor para montar meio a meio.");
        return;
      }
      if (isPaused(secondPizza.name)) {
        setError(
          `O segundo sabor (${secondPizza.name}) está pausado no momento. Escolha outro.`
        );
        return;
      }
    }

    onConfirm({
      category: pizza.category,
      size: size.toUpperCase(),
      flavors: flavors.map((f) => ({
        name: f.name,
        price: getPizzaSizePrice(f, size),
      })),
      price: unitPrice,
      qty,
      crust:
        selectedCrust && selectedCrust.price > 0
          ? { name: selectedCrust.name, price: selectedCrust.price }
          : undefined,
      extras:
        selectedExtras.length > 0
          ? selectedExtras.map((ext) => ({ name: ext.name, price: ext.price }))
          : undefined,
      removals: selectedRemovals.length > 0 ? selectedRemovals : undefined,
      observation: observation.trim() || undefined,
    });
  };

  const sizeInfo = SIZES.find((s) => s.key === size);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {showHeaderPreview && (
        <div className="grid items-center gap-4 sm:grid-cols-[140px_1fr]">
          <PizzaImage
            imgIdx={pizza.imgIdx}
            image={pizza.image}
            name={pizza.name}
            wrapperClassName="overflow-hidden rounded-xl bg-secondary"
          />
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              {pizza.name}
            </h2>
            <p className="text-sm text-muted-foreground">{pizza.desc}</p>
          </div>
        </div>
      )}

      {primaryPaused && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Este sabor está temporariamente pausado pela cozinha.</span>
        </div>
      )}

      <PizzaVisualizer
        flavor1={pizza.name}
        flavor1ImgIdx={pizza.imgIdx}
        flavor1Image={pizza.image}
        flavor2={secondPizza?.name ?? null}
        flavor2ImgIdx={secondPizza?.imgIdx ?? null}
        flavor2Image={secondPizza?.image}
        isHalf={isHalf}
        sizeLabel={
          sizeInfo ? `${sizeInfo.label} (${sizeInfo.slices})` : undefined
        }
      />

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Modo de montagem
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={!isHalf}
            onClick={() => handleToggleHalf(false)}
            className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] ${
              !isHalf
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary"
            }`}
          >
            Inteira (1 sabor)
          </button>
          <button
            type="button"
            aria-pressed={isHalf}
            onClick={() => handleToggleHalf(true)}
            className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] ${
              isHalf
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary"
            }`}
          >
            Meio a Meio (2 sabores)
          </button>
        </div>
      </fieldset>

      {isHalf && (
        <div className="space-y-1.5">
          <label
            htmlFor={`second-flavor-${pizza.id}`}
            className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Escolha a segunda metade ({pizza.category})
          </label>
          <select
            id={`second-flavor-${pizza.id}`}
            name="secondFlavor"
            value={secondFlavorName}
            onChange={(e) => {
              setSecondFlavorName(e.target.value);
              setError(null);
            }}
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-base text-foreground sm:text-sm"
          >
            {sameCategoryPeers.map((peer) => {
              const peerPaused = isPaused(peer.name);
              return (
                <option key={peer.id} value={peer.name} disabled={peerPaused}>
                  {peer.name} · R$ {formatPrice(getPizzaSizePrice(peer, size))}
                  {peerPaused ? " (Indisponível)" : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Tamanho
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((opt) => {
            const disabled = isHalf && opt.key === "p";
            const active = size === opt.key;
            const optionPrice = calculatePizzaUnitPrice({
              flavors,
              size: opt.key,
            });
            return (
              <button
                key={opt.key}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => {
                  setSize(opt.key);
                  setError(null);
                }}
                className={`min-h-14 rounded-xl border p-2.5 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "border-primary bg-primary/8 text-foreground ring-1 ring-primary/30"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary/60"
                }`}
              >
                <span className="block text-sm font-bold">
                  {opt.label} · {opt.slices}
                </span>
                <span className="block text-xs font-bold text-primary tabular-nums">
                  R$ {formatPrice(optionPrice)}
                </span>
              </button>
            );
          })}
        </div>
        {isHalf && (
          <p className="text-xs text-muted-foreground">
            Meio a meio disponível apenas nos tamanhos M (6 fatias) e G (8
            fatias).
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Borda
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {crustOptions.map((crust) => {
            const selected = crust.id === crustId;
            return (
              <label
                key={crust.id}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs transition-colors ${
                  selected
                    ? "border-primary bg-primary/8 font-bold text-foreground"
                    : "border-border bg-card hover:bg-secondary/50"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name={`crust-${pizza.id}`}
                    value={crust.id}
                    checked={selected}
                    onChange={() => setCrustId(crust.id)}
                    className="size-4 accent-primary"
                  />
                  <span>{crust.name}</span>
                </span>
                <span
                  className={`shrink-0 font-bold tabular-nums ${
                    crust.price > 0 ? "text-foreground" : "text-status-open"
                  }`}
                >
                  {crust.price > 0
                    ? `+R$ ${formatPrice(crust.price)}`
                    : "Grátis"}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {extraOptions.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Adicionais (opcional)
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {extraOptions.map((extra) => {
              const checked = selectedExtraIds.includes(extra.id);
              return (
                <label
                  key={extra.id}
                  className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs transition-colors ${
                    checked
                      ? "border-primary bg-primary/8 font-bold text-foreground"
                      : "border-border bg-card hover:bg-secondary/50"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      name="extras"
                      value={extra.id}
                      checked={checked}
                      onChange={() => toggleExtra(extra.id)}
                      className="size-4 accent-primary"
                    />
                    <span>{extra.name}</span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">
                    +R$ {formatPrice(extra.price)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {removalOptions.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Retirar ingredientes
          </legend>
          <div className="flex flex-wrap gap-2">
            {removalOptions.map((rem) => {
              const active = selectedRemovals.includes(rem);
              return (
                <button
                  key={rem}
                  type="button"
                  onClick={() => toggleRemoval(rem)}
                  aria-pressed={active}
                  className={`min-h-10 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-primary/40 bg-accent-gold-soft text-accent-gold-ink"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {rem}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor={`obs-${pizza.id}`}
          className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          Observações para a cozinha (opcional)
        </label>
        <textarea
          id={`obs-${pizza.id}`}
          name="observation"
          rows={2}
          maxLength={160}
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Ex.: massa bem assada, cortar em 8 fatias…"
          className="w-full rounded-xl border border-input bg-card p-3 text-base text-foreground placeholder:text-muted-foreground sm:text-sm"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div
          className="flex items-center overflow-hidden rounded-xl border border-border bg-card"
          aria-label="Quantidade"
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
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="flex size-11 items-center justify-center text-base font-bold text-foreground transition-colors hover:bg-secondary"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>

        <button
          type="submit"
          disabled={primaryPaused}
          className="min-h-12 flex-1 min-w-[210px] rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Adicionar à sacola · R$ {formatPrice(unitPrice * qty)}
        </button>
      </div>
    </form>
  );
}
