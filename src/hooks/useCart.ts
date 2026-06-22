import { useState, useCallback } from "react";
import type { CartItem } from "@/types";

let nextId = 1;

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, "id" | "qty">) => {
    setCart((prev) => {
      const existing = prev.find((p) => itemsMatch(item, p));
      if (existing) {
        return prev.map((p) =>
          p.id === existing.id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...item, id: nextId++, qty: 1 }];
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
