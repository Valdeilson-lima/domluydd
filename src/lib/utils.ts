import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(v: number) {
  return v.toFixed(2).replace(".", ",");
}

export function isStoreOpen() {
  return true; // ← mude para `false` para simular loja fechada
}
