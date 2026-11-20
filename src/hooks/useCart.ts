"use client";

import { useState, useEffect, useCallback } from "react";
import { roundCurrency } from "@/lib/utils";
import type { CartItem } from "@/types";

const CART_STORAGE_KEY = "donluydd_cart";

function buildCartItemSignature(item: Omit<CartItem, "id" | "qty">): string {
  const flavorsKey = [...item.flavors]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => f.name)
    .join("+");
  const extrasKey = [...(item.extras ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => e.name)
    .join(",");
  const removalsKey = [...(item.removals ?? [])].sort().join(",");
  return [
    item.category,
    item.size,
    flavorsKey,
    item.crust?.name ?? "",
    extrasKey,
    removalsKey,
    (item.observation ?? "").trim(),
  ].join("|");
}

function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCart(readCartFromStorage());
    setMounted(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) {
        setCart(readCartFromStorage());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const persistCart = useCallback((next: CartItem[]) => {
    setCart(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors cleanly
      }
    }
  }, []);

  const addToCart = useCallback(
    (item: Omit<CartItem, "id" | "qty"> & { qty?: number }) => {
      const targetSig = buildCartItemSignature(item);
      const quantityToAdd = Math.max(1, item.qty ?? 1);
      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (entry) => buildCartItemSignature(entry) === targetSig
        );
        let next: CartItem[];
        if (existingIndex >= 0) {
          next = prev.map((entry, idx) =>
            idx === existingIndex
              ? { ...entry, qty: entry.qty + quantityToAdd }
              : entry
          );
        } else {
          next = [
            ...prev,
            {
              ...item,
              id: Date.now() + Math.floor(Math.random() * 1000),
              qty: quantityToAdd,
              price: roundCurrency(item.price),
            },
          ];
        }
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });
    },
    []
  );

  const updateQty = useCallback(
    (index: number, delta: number) => {
      const next = cart
        .map((item, idx) =>
          idx === index ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0);
      persistCart(next);
    },
    [cart, persistCart]
  );

  const removeFromCart = useCallback(
    (index: number) => {
      persistCart(cart.filter((_, idx) => idx !== index));
    },
    [cart, persistCart]
  );

  const clearCart = useCallback(() => {
    persistCart([]);
  }, [persistCart]);

  const setCartItems = useCallback(
    (items: CartItem[]) => {
      persistCart(items);
    },
    [persistCart]
  );

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = roundCurrency(
    cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  return {
    cart,
    mounted,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    setCartItems,
    totalQty,
    subtotal,
  };
}
