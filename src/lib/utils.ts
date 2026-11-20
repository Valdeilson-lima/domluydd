import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { STORE_TIMEZONE } from "@/lib/store-config";
import type { StoreMode } from "@/types/store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatPrice(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundCurrency(v));
}

export function normalizeText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Dias abertos (0 = domingo, 1 = segunda). Segunda-feira a loja fecha. */
export const OPEN_DAYS = [0, 2, 3, 4, 5, 6];
export const OPEN_HOUR = 18;
export const CLOSE_HOUR = 22;

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getStoreLocalTimeParts(date: Date = new Date()): {
  day: number;
  minutes: number;
  dateKey: string;
} {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: STORE_TIMEZONE,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((p) => [p.type, p.value])
    );
    const day = WEEKDAY_MAP[parts.weekday] ?? date.getDay();
    const hour = Number(parts.hour ?? date.getHours()) % 24;
    const minute = Number(parts.minute ?? date.getMinutes());
    const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
    return { day, minutes: hour * 60 + minute, dateKey };
  } catch {
    return {
      day: date.getDay(),
      minutes: date.getHours() * 60 + date.getMinutes(),
      dateKey: date.toISOString().slice(0, 10),
    };
  }
}

/**
 * Verifica se a loja estaria aberta de acordo com o horário comercial padrão
 * na timezone oficial da loja (terça a domingo, das 18h às 22h).
 */
export function isScheduleOpen(date: Date = new Date()): boolean {
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("aberto");
    if (param === "1") return true;
    if (param === "0") return false;
  }
  const { day, minutes } = getStoreLocalTimeParts(date);
  return (
    OPEN_DAYS.includes(day) &&
    minutes >= OPEN_HOUR * 60 &&
    minutes < CLOSE_HOUR * 60
  );
}

/** Rótulo textual da próxima abertura ou encerramento no modo automático. */
export function getScheduleNextLabel(date: Date = new Date()): string {
  const open = isScheduleOpen(date);
  const { day, minutes } = getStoreLocalTimeParts(date);

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
 * - 'auto': Segue o horário automático da semana em America/Fortaleza
 */
export function resolveStoreStatus(
  settings?: {
    mode?: StoreMode;
    custom_message?: string | null;
  } | null,
  date: Date = new Date()
): StoreStatus {
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
      nextLabel: customMessage || "Aberto agora · Pedidos liberados",
      customMessage,
    };
  }

  if (mode === "closed") {
    return {
      open: false,
      mode: "closed",
      nextLabel: customMessage || "Fechado no momento · Novos pedidos pausados",
      customMessage,
    };
  }

  const autoOpen = isScheduleOpen(date);
  return {
    open: autoOpen,
    mode: "auto",
    nextLabel: customMessage || getScheduleNextLabel(date),
    customMessage,
  };
}

export function isStoreOpen(date: Date = new Date()): boolean {
  return isScheduleOpen(date);
}

export function getStoreStatus(date: Date = new Date()): StoreStatus {
  return resolveStoreStatus({ mode: "auto" }, date);
}
