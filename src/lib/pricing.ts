import { allPizzas, CRUST_OPTIONS, EXTRA_INGREDIENTS } from "@/data/pizzas";
import { bebidas } from "@/data/drinks";
import { combos } from "@/data/combos";
import { bairros } from "@/data/bairros";
import { normalizeText, roundCurrency } from "@/lib/utils";
import type { CartItem, Pizza } from "@/types";

export type PizzaSizeKey = "p" | "m" | "g";

export function normalizePizzaSize(size: string): PizzaSizeKey | null {
  const normalized = normalizeText(size);
  if (normalized === "p" || normalized.startsWith("pequena")) return "p";
  if (normalized === "m" || normalized.startsWith("media")) return "m";
  if (normalized === "g" || normalized.startsWith("grande")) return "g";
  return null;
}

export function getPizzaSizePrice(pizza: Pizza, sizeKey: PizzaSizeKey): number {
  return pizza[sizeKey];
}

export function calculatePizzaUnitPrice(params: {
  flavors: Pizza[];
  size: PizzaSizeKey;
  crustPrice?: number;
  extrasPrices?: number[];
}): number {
  const { flavors, size, crustPrice = 0, extrasPrices = [] } = params;
  if (flavors.length === 0) return 0;

  // Regra da casa: pizza meio a meio cobra pelo sabor de maior valor no tamanho escolhido.
  const basePrice = Math.max(...flavors.map((f) => getPizzaSizePrice(f, size)));
  const extrasTotal = extrasPrices.reduce((sum, p) => sum + p, 0);
  return roundCurrency(basePrice + crustPrice + extrasTotal);
}

export function findBairroFee(
  bairroName: string | null | undefined
): number | null {
  if (!bairroName) return null;
  const target = normalizeText(bairroName);
  const match = bairros.find((b) => normalizeText(b.nome) === target);
  return match ? match.frete : null;
}

export function getDeliveryFee(
  deliveryType: "delivery" | "takeaway",
  bairroName?: string | null
): number {
  if (deliveryType === "takeaway") return 0;
  return findBairroFee(bairroName) ?? 0;
}

export function calculateOrderTotals(params: {
  items: Pick<CartItem, "price" | "qty">[];
  deliveryType: "delivery" | "takeaway";
  bairroName?: string | null;
}): { subtotal: number; deliveryFee: number; total: number } {
  const subtotal = roundCurrency(
    params.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  );
  const deliveryFee = roundCurrency(
    getDeliveryFee(params.deliveryType, params.bairroName)
  );
  const total = roundCurrency(subtotal + deliveryFee);
  return { subtotal, deliveryFee, total };
}

export function calculateChange(
  total: number,
  changeFor: number | null | undefined
): number | null {
  if (typeof changeFor !== "number" || !Number.isFinite(changeFor)) return null;
  if (changeFor <= total) return null;
  return roundCurrency(changeFor - total);
}

export interface RepriceResult {
  ok: true;
  items: CartItem[];
}

export interface RepriceError {
  ok: false;
  error: string;
}

export function validateAndRepriceItems(
  rawItems: CartItem[],
  pausedItems: string[]
): RepriceResult | RepriceError {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, error: "O pedido precisa conter pelo menos um item." };
  }

  const pausedSet = new Set(pausedItems.map((name) => normalizeText(name)));
  const repriced: CartItem[] = [];

  for (const item of rawItems) {
    const qty = Math.max(1, Math.min(20, Math.floor(Number(item.qty) || 1)));
    const cat = normalizeText(item.category);

    if (cat === "bebida") {
      const targetName = item.flavors?.[0]?.name;
      const drink = bebidas.find(
        (d) => normalizeText(d.name) === normalizeText(targetName ?? "")
      );
      if (!drink) {
        return {
          ok: false,
          error: `Bebida inválida: ${targetName || "desconhecida"}.`,
        };
      }
      if (
        pausedSet.has(normalizeText(drink.name)) ||
        drink.available === false
      ) {
        return {
          ok: false,
          error: `A bebida "${drink.name}" está temporariamente indisponível.`,
        };
      }
      repriced.push({
        id: Number(item.id) || Date.now(),
        category: "bebida",
        size: "Único",
        flavors: [{ name: drink.name, price: drink.price }],
        price: drink.price,
        qty,
        observation: item.observation?.trim().slice(0, 160) || undefined,
      });
      continue;
    }

    if (cat === "combo") {
      const targetName = item.flavors?.[0]?.name;
      const combo = combos.find(
        (c) =>
          normalizeText(c.name) === normalizeText(targetName ?? "") ||
          c.id === targetName
      );
      if (!combo) {
        return {
          ok: false,
          error: `Combo inválido: ${targetName || "desconhecido"}.`,
        };
      }
      if (
        pausedSet.has(normalizeText(combo.name)) ||
        combo.available === false
      ) {
        return {
          ok: false,
          error: `O "${combo.name}" está temporariamente indisponível.`,
        };
      }
      repriced.push({
        id: Number(item.id) || Date.now(),
        category: "combo",
        size: "Combo",
        flavors: [{ name: combo.name, price: combo.price }],
        price: combo.price,
        qty,
        observation: item.observation?.trim().slice(0, 160) || undefined,
      });
      continue;
    }

    const sizeKey = normalizePizzaSize(item.size || "");
    if (!sizeKey) {
      return { ok: false, error: `Tamanho de pizza inválido: ${item.size}.` };
    }

    const rawFlavors = Array.isArray(item.flavors) ? item.flavors : [];
    if (rawFlavors.length === 0 || rawFlavors.length > 2) {
      return { ok: false, error: "Cada pizza deve ter 1 ou 2 sabores." };
    }
    if (rawFlavors.length > 1 && sizeKey === "p") {
      return {
        ok: false,
        error:
          "Opção meio a meio disponível apenas nos tamanhos Média (M) e Grande (G).",
      };
    }

    const resolvedFlavors: Pizza[] = [];
    for (const rf of rawFlavors) {
      const found = allPizzas.find(
        (p) => normalizeText(p.name) === normalizeText(rf.name)
      );
      if (!found) {
        return { ok: false, error: `Sabor inválido: ${rf.name}.` };
      }
      if (
        pausedSet.has(normalizeText(found.name)) ||
        found.available === false
      ) {
        return {
          ok: false,
          error: `O sabor "${found.name}" está pausado no momento.`,
        };
      }
      resolvedFlavors.push(found);
    }

    const itemCategory = resolvedFlavors[0].category;
    if (resolvedFlavors.some((f) => f.category !== itemCategory)) {
      return {
        ok: false,
        error: "Não é possível misturar pizza salgada e doce no mesmo disco.",
      };
    }

    let resolvedCrust: { name: string; price: number } | undefined;
    if (item.crust?.name) {
      const crustMatch = CRUST_OPTIONS.find(
        (c) => normalizeText(c.name) === normalizeText(item.crust!.name)
      );
      if (!crustMatch) {
        return { ok: false, error: `Borda inválida: ${item.crust.name}.` };
      }
      if (!crustMatch.compatibleWith.includes(itemCategory)) {
        return {
          ok: false,
          error: `A borda "${crustMatch.name}" não está disponível para pizza ${itemCategory}.`,
        };
      }
      if (crustMatch.price > 0) {
        resolvedCrust = { name: crustMatch.name, price: crustMatch.price };
      }
    }

    const resolvedExtras: Array<{ name: string; price: number }> = [];
    if (Array.isArray(item.extras)) {
      for (const ext of item.extras) {
        const extraMatch = EXTRA_INGREDIENTS.find(
          (e) => normalizeText(e.name) === normalizeText(ext.name)
        );
        if (!extraMatch) {
          return { ok: false, error: `Adicional inválido: ${ext.name}.` };
        }
        if (!extraMatch.compatibleWith.includes(itemCategory)) {
          return {
            ok: false,
            error: `Adicional "${extraMatch.name}" incompatível com pizza ${itemCategory}.`,
          };
        }
        resolvedExtras.push({ name: extraMatch.name, price: extraMatch.price });
      }
    }

    const unitPrice = calculatePizzaUnitPrice({
      flavors: resolvedFlavors,
      size: sizeKey,
      crustPrice: resolvedCrust?.price ?? 0,
      extrasPrices: resolvedExtras.map((e) => e.price),
    });

    repriced.push({
      id: Number(item.id) || Date.now(),
      category: itemCategory,
      size: sizeKey.toUpperCase(),
      flavors: resolvedFlavors.map((f) => ({
        name: f.name,
        price: getPizzaSizePrice(f, sizeKey),
      })),
      price: unitPrice,
      qty,
      crust: resolvedCrust,
      extras: resolvedExtras.length > 0 ? resolvedExtras : undefined,
      removals: Array.isArray(item.removals)
        ? item.removals.slice(0, 8)
        : undefined,
      observation: item.observation?.trim().slice(0, 160) || undefined,
    });
  }

  return { ok: true, items: repriced };
}
