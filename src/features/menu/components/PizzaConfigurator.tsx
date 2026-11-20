"use client";

import { useState, useMemo } from "react";
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

  const [size, setSize] = useState<PizzaSizeKey>("m");
  const [isHalf, setIsHalf] = useState(false);
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
      setError(`O sabor ${pizza.name} está temporariamente pausado.`);
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
        <div className="grid gap-4 sm:grid-cols-[140px_1fr] items-center">
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
        <p
          role="alert"
          className="border border-foreground bg-secondary px-3 py-2 text-xs font-semibold text-foreground"
        >
          Este sabor está temporariamente pausado pela cozinha.
        </p>
      )}

      <PizzaVisualizer
        flavor1={pizza.name}
        flavor2={secondPizza?.name ?? null}
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
            onClick={() => handleToggleHalf(false)}
            className={`h-10 border text-xs font-semibold transition-colors ${
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
            onClick={() => handleToggleHalf(true)}
            className={`h-10 border text-xs font-semibold transition-colors ${
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
            value={secondFlavorName}
            onChange={(e) => {
              setSecondFlavorName(e.target.value);
              setError(null);
            }}
            className="h-11 w-full border border-input bg-card px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
            style={{ borderRadius: "2px" }}
          >
            {sameCategoryPeers.map((peer) => {
              const peerPaused = isPaused(peer.name);
              return (
                <option key={peer.id} value={peer.name} disabled={peerPaused}>
                  {peer.name} — R$ {formatPrice(getPizzaSizePrice(peer, size))}
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
                onClick={() => {
                  setSize(opt.key);
                  setError(null);
                }}
                className={`border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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
                className={`flex cursor-pointer items-center justify-between gap-2 border p-2.5 text-xs ${
                  selected
                    ? "border-foreground bg-secondary font-semibold"
                    : "border-border bg-card"
                }`}
                style={{ borderRadius: "2px" }}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`crust-${pizza.id}`}
                    value={crust.id}
                    checked={selected}
                    onChange={() => setCrustId(crust.id)}
                    className="accent-primary"
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
                  className={`flex cursor-pointer items-center justify-between gap-2 border p-2.5 text-xs ${
                    checked
                      ? "border-foreground bg-secondary font-semibold"
                      : "border-border bg-card"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExtra(extra.id)}
                      className="accent-primary"
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
                  className={`h-8 border px-3 text-xs font-medium transition-colors ${
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
          rows={2}
          maxLength={160}
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Ex.: Massa bem assada, cortar em 8 fatias…"
          className="w-full border border-input bg-card p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          style={{ borderRadius: "2px" }}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="border border-foreground bg-secondary px-3 py-2 text-xs font-semibold text-foreground"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center border border-border bg-card">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-10 w-10 text-base font-bold text-foreground hover:bg-secondary"
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
            className="h-10 w-10 text-base font-bold text-foreground hover:bg-secondary"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>

        <button
          type="submit"
          disabled={primaryPaused}
          className="h-11 flex-1 min-w-[200px] bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          style={{ borderRadius: "2px" }}
        >
          Adicionar à sacola · R$ {formatPrice(unitPrice * qty)}
        </button>
      </div>
    </form>
  );
}
