import { useState, useCallback } from "react";
import type { CartItem } from "@/types";

let nextId = 1;

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    const newItem: CartItem = { ...item, id: nextId++ };
    setCart((prev) => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const total = cart.reduce((s, i) => s + i.price, 0);

  const toggleCart = useCallback((open?: boolean) => {
    setCartOpen((prev) => open ?? !prev);
  }, []);

  return { cart, addItem, removeItem, clearCart, total, cartOpen, toggleCart };
}

export type CartContextType = ReturnType<typeof useCart>;
