import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StoreMode } from "@/types/store";

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
 * Verifica se a loja estaria aberta de acordo com o horário comercial padrão
 * (terça a domingo, das 18h às 22h).
 */
export function isScheduleOpen(date: Date = new Date()) {
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

/** Rótulo textual da próxima abertura ou encerramento no modo automático. */
export function getScheduleNextLabel(date: Date = new Date()): string {
  const open = isScheduleOpen(date);
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();

  if (open) {
    return "Pedidos até 22h";
  } else if (day === 1) {
    return "Abrimos terça às 18h";
  } else if (minutes < OPEN_HOUR * 60) {
    return "Abrimos hoje às 18h";
  } else if (day === 0) {
    return "Abrimos terça às 18h";
  } else if (day === 6) {
    return "Abrimos domingo às 18h";
  } else {
    return "Abrimos amanhã às 18h";
  }
}

export interface StoreStatus {
  open: boolean;
  mode?: StoreMode;
  nextLabel: string;
  customMessage?: string | null;
}

/**
 * Resolve o status final da loja considerando a preferência do dono:
 * - 'open': Aberta forçada (mesmo fora do horário comercial)
 * - 'closed': Fechada forçada (mesmo dentro do horário comercial)
 * - 'auto': Segue o horário automático da semana
 */
export function resolveStoreStatus(
  settings?: {
    mode?: StoreMode;
    custom_message?: string | null;
  } | null,
  date: Date = new Date()
): StoreStatus {
  // Parâmetros de teste na URL têm prioridade em ambiente de desenvolvimento/testes
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("aberto");
    if (param === "1") {
      return {
        open: true,
        mode: "open",
        nextLabel: "Aberto para testes (URL ?aberto=1)",
        customMessage: settings?.custom_message || null,
      };
    }
    if (param === "0") {
      return {
        open: false,
        mode: "closed",
        nextLabel: "Fechado para testes (URL ?aberto=0)",
        customMessage: settings?.custom_message || null,
      };
    }
  }

  const mode = settings?.mode || "auto";
  const customMessage = settings?.custom_message?.trim() || null;

  if (mode === "open") {
    return {
      open: true,
      mode: "open",
      nextLabel: customMessage || "Aberto pelo Don Luydd · Pedidos Liberados!",
      customMessage,
    };
  }

  if (mode === "closed") {
    return {
      open: false,
      mode: "closed",
      nextLabel: customMessage || "Fechado no Momento · Novos pedidos pausados",
      customMessage,
    };
  }

  // Modo Automático (segue a grade horária)
  const autoOpen = isScheduleOpen(date);
  return {
    open: autoOpen,
    mode: "auto",
    nextLabel: customMessage || getScheduleNextLabel(date),
    customMessage,
  };
}

/**
 * A loja abre de terça a domingo, das 18h às 22h (ou via URL ?aberto=1|0).
 * Mantido para compatibilidade retroativa.
 */
export function isStoreOpen(date: Date = new Date()) {
  return isScheduleOpen(date);
}

/** Status padrão retrocompatível. */
export function getStoreStatus(date: Date = new Date()): StoreStatus {
  return resolveStoreStatus({ mode: "auto" }, date);
}
