"use client";

import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { allPizzas } from "@/data/pizzas";
import { PizzaVisualizer } from "@/features/menu/components/PizzaVisualizer";
import { PizzaImage } from "@/features/menu/components/PizzaImage";
import {
  getCrustOptionsForCategory,
  getExtraIngredientsForCategory,
  getRemovalsForCategory,
} from "@/lib/catalog";
import {
  calculatePizzaUnitPrice,
  getPizzaSizePrice,
  type PizzaSizeKey,
} from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import type { CartItem, Pizza } from "@/types";

interface PizzaConfiguratorProps {
  pizza: Pizza;
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
    [pizza.category, pizza.name]
  );

  const firstAvailablePeer = useMemo(
    () =>
      sameCategoryPeers.find((p) => !isPaused(p.name))?.name ??
      sameCategoryPeers[0]?.name ??
      "",
    [sameCategoryPeers, isPaused]
  );

  const crustOptions = useMemo(
    () => getCrustOptionsForCategory(pizza.category),
    [pizza.category]
  );
  const extraOptions = useMemo(
    () => getExtraIngredientsForCategory(pizza.category),
    [pizza.category]
  );
  const removalOptions = useMemo(
    () => getRemovalsForCategory(pizza.category),
    [pizza.category]
  );

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
          <PizzaImage imgIdx={pizza.imgIdx} name={pizza.name} />
          <div className="space-y-1">
            <h2 className="font-serif text-2xl text-foreground">
              {pizza.name}
            </h2>
            <p className="text-sm text-muted-foreground">{pizza.desc}</p>
          </div>
        </div>
      )}

      {primaryPaused && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-foreground bg-secondary px-3.5 py-2.5 text-xs font-semibold text-foreground"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Este sabor está temporariamente pausado pela cozinha.</span>
        </div>
      )}

      <PizzaVisualizer
        flavor1={pizza.name}
        flavor1ImgIdx={pizza.imgIdx}
        flavor2={secondPizza?.name ?? null}
        flavor2ImgIdx={secondPizza?.imgIdx ?? null}
        isHalf={isHalf}
        sizeLabel={
          sizeInfo ? `${sizeInfo.label} (${sizeInfo.slices})` : undefined
        }
      />

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Modo de montagem
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={!isHalf}
            onClick={() => handleToggleHalf(false)}
            className={`min-h-11 border px-3 text-xs font-semibold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] ${
              !isHalf
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-secondary"
            }`}
            style={{ borderRadius: "2px" }}
          >
            Inteira (1 sabor)
          </button>
          <button
            type="button"
            aria-pressed={isHalf}
            onClick={() => handleToggleHalf(true)}
            className={`min-h-11 border px-3 text-xs font-semibold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] ${
              isHalf
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-secondary"
            }`}
            style={{ borderRadius: "2px" }}
          >
            Meio a Meio (2 sabores)
          </button>
        </div>
      </fieldset>

      {isHalf && (
        <div className="space-y-1.5">
          <label
            htmlFor={`second-flavor-${pizza.id}`}
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
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
            className="min-h-11 w-full border border-input bg-card px-3 text-base text-foreground sm:text-sm"
            style={{ borderRadius: "2px" }}
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
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                className={`min-h-14 border p-2.5 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "border-foreground bg-secondary text-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary/60"
                }`}
                style={{ borderRadius: "2px" }}
              >
                <span className="block text-sm font-bold">
                  {opt.label} · {opt.slices}
                </span>
                <span className="block font-mono text-xs text-muted-foreground tabular-nums">
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
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Borda
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {crustOptions.map((crust) => {
            const selected = crust.id === crustId;
            return (
              <label
                key={crust.id}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 border px-3 py-2.5 text-xs transition-colors ${
                  selected
                    ? "border-foreground bg-secondary font-semibold"
                    : "border-border bg-card hover:bg-secondary/50"
                }`}
                style={{ borderRadius: "2px" }}
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
                <span className="shrink-0 font-mono tabular-nums">
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
          <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Adicionais (opcional)
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {extraOptions.map((extra) => {
              const checked = selectedExtraIds.includes(extra.id);
              return (
                <label
                  key={extra.id}
                  className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 border px-3 py-2.5 text-xs transition-colors ${
                    checked
                      ? "border-foreground bg-secondary font-semibold"
                      : "border-border bg-card hover:bg-secondary/50"
                  }`}
                  style={{ borderRadius: "2px" }}
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
                  <span className="shrink-0 font-mono tabular-nums">
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
          <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  className={`min-h-10 border px-3.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-foreground bg-secondary font-semibold text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ borderRadius: "2px" }}
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
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
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
          className="w-full border border-input bg-card p-3 text-base text-foreground placeholder:text-muted-foreground sm:text-sm"
          style={{ borderRadius: "2px" }}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-foreground bg-secondary px-3.5 py-2.5 text-xs font-semibold text-foreground"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div
          className="flex items-center border border-border bg-card"
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
          <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums">
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
          className="min-h-11 flex-1 min-w-[210px] bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
          style={{ borderRadius: "2px" }}
        >
          Adicionar à sacola · R$ {formatPrice(unitPrice * qty)}
        </button>
      </div>
    </form>
  );
}
