import { useState, useCallback, useEffect } from "react";
import type { CartItem } from "@/types";

const STORAGE_KEY = "donluydd.cart.v1";

function loadCart(): CartItem[] {
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

function itemsMatch(a: Omit<CartItem, "id" | "qty">, b: CartItem): boolean {
  if (a.size !== b.size || a.category !== b.category) return false;
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
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [cartOpen, setCartOpen] = useState(false);

  // Persiste o carrinho para não perder o pedido ao recarregar a página
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* armazenamento indisponível — segue apenas em memória */
    }
  }, [cart]);

  const addItem = useCallback((item: Omit<CartItem, "id" | "qty">, qty = 1) => {
    if (qty <= 0) return;
    setCart((prev) => {
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
    setCart((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateQty = useCallback((id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p
        )
        .filter((p) => p.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
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
    total,
    itemCount,
    cartOpen,
    toggleCart,
  };
}

export type CartContextType = ReturnType<typeof useCart>;
