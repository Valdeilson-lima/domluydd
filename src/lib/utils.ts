import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(v: number) {
  return v.toFixed(2).replace(".", ",");
}

/** Dias abertos (0 = domingo, 1 = segunda). Segunda-feira a loja fecha. */
export const OPEN_DAYS = [0, 2, 3, 4, 5, 6];
export const OPEN_HOUR = 18;
export const CLOSE_HOUR = 22;

/**
 * A loja abre de terça a domingo, das 18h às 22h.
 * Dica para testes: use `?aberto=1` (força aberto) ou `?aberto=0` (força fechado) na URL.
 */
export function isStoreOpen(date: Date = new Date()) {
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("aberto");
    if (param === "1") return true;
    if (param === "0") return false;
  }
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();
  return (
    OPEN_DAYS.includes(day) &&
    minutes >= OPEN_HOUR * 60 &&
    minutes < CLOSE_HOUR * 60
  );
}

export interface StoreStatus {
  open: boolean;
  nextLabel: string;
}

/** Status atualizado da loja + rótulo de próximo horário de funcionamento. */
export function getStoreStatus(date: Date = new Date()): StoreStatus {
  const open = isStoreOpen(date);
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();

  let nextLabel: string;
  if (open) {
    nextLabel = "Pedidos até 22h";
  } else if (day === 1) {
    nextLabel = "Abrimos terça às 18h";
  } else if (minutes < OPEN_HOUR * 60) {
    nextLabel = "Abrimos hoje às 18h";
  } else if (day === 0) {
    nextLabel = "Abrimos terça às 18h";
  } else if (day === 6) {
    nextLabel = "Abrimos domingo às 18h";
  } else {
    nextLabel = "Abrimos amanhã às 18h";
  }

  return { open, nextLabel };
}
