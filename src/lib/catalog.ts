import {
  COMMON_REMOVALS,
  CRUST_OPTIONS,
  EXTRA_INGREDIENTS,
  SWEET_REMOVALS,
} from "@/data/pizzas";
import { normalizeText } from "@/lib/utils";
import type { Combo, Drink, Pizza, PizzaCategory } from "@/types";

export function filterPizzas(
  list: Pizza[],
  options: { category?: PizzaCategory | "all"; tag?: string; search?: string }
): Pizza[] {
  const query = normalizeText(options.search || "");
  const activeTag =
    options.tag && options.tag !== "Todas" ? normalizeText(options.tag) : "";

  return list.filter((pizza) => {
    if (
      options.category &&
      options.category !== "all" &&
      pizza.category !== options.category
    ) {
      return false;
    }
    if (activeTag) {
      const matchesTag = pizza.tags.some((t) => normalizeText(t) === activeTag);
      if (!matchesTag) return false;
    }
    if (query) {
      const haystack = normalizeText(
        `${pizza.name} ${pizza.desc} ${pizza.tags.join(" ")}`
      );
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function filterDrinks(
  list: Drink[],
  options: { tag?: string; search?: string }
): Drink[] {
  const query = normalizeText(options.search || "");
  const activeTag =
    options.tag && options.tag !== "Todas" ? normalizeText(options.tag) : "";

  return list.filter((drink) => {
    if (activeTag) {
      const matchesTag = drink.tags.some((t) => normalizeText(t) === activeTag);
      if (!matchesTag) return false;
    }
    if (query) {
      const haystack = normalizeText(
        `${drink.name} ${drink.desc} ${drink.tags.join(" ")}`
      );
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function filterCombos(list: Combo[], search?: string): Combo[] {
  const query = normalizeText(search || "");
  if (!query) return list;

  return list.filter((combo) => {
    const haystack = normalizeText(
      `${combo.name} ${combo.desc} ${combo.items.join(" ")}`
    );
    return haystack.includes(query);
  });
}

export function getCrustOptionsForCategory(category: PizzaCategory) {
  return CRUST_OPTIONS.filter((c) => c.compatibleWith.includes(category));
}

export function getExtraIngredientsForCategory(category: PizzaCategory) {
  return EXTRA_INGREDIENTS.filter((e) => e.compatibleWith.includes(category));
}

export function getRemovalsForCategory(category: PizzaCategory): string[] {
  return category === "doce" ? SWEET_REMOVALS : COMMON_REMOVALS;
}
