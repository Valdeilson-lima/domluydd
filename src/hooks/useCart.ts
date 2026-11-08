import { useState, useCallback, useSyncExternalStore } from "react";
import type { CartItem } from "@/types";

const STORAGE_KEY = "donluydd.cart.v1";

let cartState: CartItem[] = [];
let initialized = false;
const listeners = new Set<() => void>();

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) =>
        i &&
        typeof i.id === "number" &&
        Array.isArray(i.flavors) &&
        typeof i.qty === "number"
    );
  } catch {
    return [];
  }
}

function getCartSnapshot(): CartItem[] {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    cartState = loadFromStorage();
  }
  return cartState;
}

const SERVER_SNAPSHOT: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function updateCart(updater: (prev: CartItem[]) => CartItem[]) {
  cartState = updater(getCartSnapshot());
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartState));
    } catch {
      /* armazenamento indisponível — segue apenas em memória */
    }
  }
  listeners.forEach((l) => l());
}

function itemsMatch(a: Omit<CartItem, "id" | "qty">, b: CartItem): boolean {
  if (a.size !== b.size || a.category !== b.category) return false;
  if ((a.observation || "") !== (b.observation || "")) return false;
  if ((a.crust?.name || "") !== (b.crust?.name || "")) return false;
  const aExtras = (a.extras || [])
    .map((e) => e.name)
    .sort()
    .join("|");
  const bExtras = (b.extras || [])
    .map((e) => e.name)
    .sort()
    .join("|");
  if (aExtras !== bExtras) return false;
  const aRemovals = (a.removals || []).sort().join("|");
  const bRemovals = (b.removals || []).sort().join("|");
  if (aRemovals !== bRemovals) return false;
  if (a.flavors.length !== b.flavors.length) return false;
  const aNames = a.flavors
    .map((f) => f.name)
    .sort()
    .join("|");
  const bNames = b.flavors
    .map((f) => f.name)
    .sort()
    .join("|");
  return aNames === bNames;
}

export function useCart() {
  const cart = useSyncExternalStore(
    subscribe,
    getCartSnapshot,
    getServerSnapshot
  );
  const [cartOpen, setCartOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, "id" | "qty">, qty = 1) => {
    if (qty <= 0) return;
    updateCart((prev) => {
      const existing = prev.find((p) => itemsMatch(item, p));
      if (existing) {
        return prev.map((p) =>
          p.id === existing.id ? { ...p, qty: p.qty + qty } : p
        );
      }
      const nextId = prev.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      return [...prev, { ...item, id: nextId, qty }];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    updateCart((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateQty = useCallback((id: number, delta: number) => {
    updateCart((prev) =>
      prev
        .map((p) =>
          p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p
        )
        .filter((p) => p.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    updateCart(() => []);
  }, []);

  const repeatOrder = useCallback((items: CartItem[]) => {
    updateCart(() =>
      items.map((item, idx) => ({
        ...item,
        id: idx + 1,
      }))
    );
    setCartOpen(true);
  }, []);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const toggleCart = useCallback((open?: boolean) => {
    setCartOpen((prev) => open ?? !prev);
  }, []);

  return {
    cart,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    repeatOrder,
    total,
    itemCount,
    cartOpen,
    toggleCart,
  };
}

export type CartContextType = ReturnType<typeof useCart>;
