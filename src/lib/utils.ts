import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  DEFAULT_WEEKLY_SCHEDULE,
  STORE_TIMEZONE,
  WEEKDAY_NAMES,
  WEEKDAY_ORDER,
} from "@/lib/store-config";
import type { DayKey, StoreMode, WeeklySchedule } from "@/types/store";

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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Compatibilidade legada — horários padrão caso não haja schedule customizado. */
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

function parseTimeToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function formatShortHour(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return timeStr;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

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

function getActiveWindowForTime(
  day: number,
  minutes: number,
  schedule: WeeklySchedule
): { open: boolean; closeLabel?: string } {
  const todayKey = String(day) as DayKey;
  const today = schedule[todayKey];
  if (today?.enabled) {
    const openMin = parseTimeToMinutes(today.open);
    const closeMin = parseTimeToMinutes(today.close);
    if (closeMin > openMin) {
      if (minutes >= openMin && minutes < closeMin) {
        return { open: true, closeLabel: formatShortHour(today.close) };
      }
    } else if (closeMin < openMin) {
      // Horário atravessa a meia-noite (ex.: 18:00 às 00:30)
      if (minutes >= openMin) {
        return { open: true, closeLabel: formatShortHour(today.close) };
      }
    }
  }

  // Checa se ontem abriu atravessando a meia-noite e ainda está aberto agora
  const prevDay = (day + 6) % 7;
  const prev = schedule[String(prevDay) as DayKey];
  if (prev?.enabled) {
    const prevOpenMin = parseTimeToMinutes(prev.open);
    const prevCloseMin = parseTimeToMinutes(prev.close);
    if (prevCloseMin < prevOpenMin && minutes < prevCloseMin) {
      return { open: true, closeLabel: formatShortHour(prev.close) };
    }
  }

  return { open: false };
}

/**
 * Verifica se a loja estaria aberta de acordo com a grade semanal configurada
 * na timezone oficial da loja.
 */
export function isScheduleOpen(
  date: Date = new Date(),
  schedule: WeeklySchedule = DEFAULT_WEEKLY_SCHEDULE
): boolean {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const param = new URLSearchParams(window.location.search).get("aberto");
    if (param === "1") return true;
    if (param === "0") return false;
  }
  const { day, minutes } = getStoreLocalTimeParts(date);
  return getActiveWindowForTime(day, minutes, schedule).open;
}

/** Rótulo textual da próxima abertura ou encerramento no modo automático. */
export function getScheduleNextLabel(
  date: Date = new Date(),
  schedule: WeeklySchedule = DEFAULT_WEEKLY_SCHEDULE
): string {
  const { day, minutes } = getStoreLocalTimeParts(date);
  const current = getActiveWindowForTime(day, minutes, schedule);

  if (current.open) {
    return `Pedidos até ${current.closeLabel ?? "22h"}`;
  }

  const today = schedule[String(day) as DayKey];
  if (today?.enabled && minutes < parseTimeToMinutes(today.open)) {
    return `Abrimos hoje às ${formatShortHour(today.open)}`;
  }

  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = (day + offset) % 7;
    const key = String(nextDay) as DayKey;
    const slot = schedule[key];
    if (slot?.enabled) {
      const hourLabel = formatShortHour(slot.open);
      if (offset === 1) {
        return `Abrimos amanhã às ${hourLabel}`;
      }
      return `Abrimos ${WEEKDAY_NAMES[key].lower} às ${hourLabel}`;
    }
  }

  return "Horário sob consulta";
}

export interface ScheduleDisplayRow {
  label: string;
  hours: string;
  isClosed: boolean;
}

/** Agrupa dias consecutivos com o mesmo horário para exibir bonito na Home / Admin. */
export function groupScheduleForDisplay(
  schedule: WeeklySchedule = DEFAULT_WEEKLY_SCHEDULE
): ScheduleDisplayRow[] {
  const order: DayKey[] = ["2", "3", "4", "5", "6", "0", "1"]; // Ter..Dom, Seg
  const groups: Array<{
    days: DayKey[];
    enabled: boolean;
    open: string;
    close: string;
  }> = [];

  for (const key of order) {
    const slot = schedule[key];
    const last = groups[groups.length - 1];
    if (
      last &&
      last.enabled === slot.enabled &&
      (!slot.enabled || (last.open === slot.open && last.close === slot.close))
    ) {
      last.days.push(key);
    } else {
      groups.push({
        days: [key],
        enabled: slot.enabled,
        open: slot.open,
        close: slot.close,
      });
    }
  }

  return groups.map((g) => {
    const first = WEEKDAY_NAMES[g.days[0]];
    const last = WEEKDAY_NAMES[g.days[g.days.length - 1]];
    let label = first.full;
    if (g.days.length === 2) {
      label = `${first.short} e ${last.short}`;
    } else if (g.days.length > 2) {
      label = `${first.full.replace("-feira", "")} a ${last.lower.replace("-feira", "")}`;
    }
    return {
      label,
      hours: g.enabled
        ? `${formatShortHour(g.open)} às ${formatShortHour(g.close)}`
        : "Fechado",
      isClosed: !g.enabled,
    };
  });
}

export function formatScheduleSummary(
  schedule: WeeklySchedule = DEFAULT_WEEKLY_SCHEDULE
): { full: string; short: string } {
  const enabledRows = groupScheduleForDisplay(schedule).filter(
    (r) => !r.isClosed
  );
  if (enabledRows.length === 0) {
    return { full: "Horário sob consulta", short: "Sob consulta" };
  }
  if (enabledRows.length === 1) {
    const row = enabledRows[0];
    const enabledKeys = WEEKDAY_ORDER.filter((k) => schedule[k].enabled);
    const shortDays =
      enabledKeys.length === 7
        ? "Todos os dias"
        : enabledKeys.length === 6 && !schedule["1"].enabled
          ? "Ter–Dom"
          : `${WEEKDAY_NAMES[enabledKeys[0]].short}–${WEEKDAY_NAMES[enabledKeys[enabledKeys.length - 1]].short}`;
    return {
      full: `${row.label}, ${row.hours}`,
      short: `${shortDays} · ${row.hours}`,
    };
  }
  const primary = enabledRows[0];
  return {
    full: enabledRows.map((r) => `${r.label} (${r.hours})`).join(" · "),
    short: `${primary.label} · ${primary.hours}`,
  };
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
 * - 'auto': Segue a grade semanal configurada em America/Fortaleza
 */
export function resolveStoreStatus(
  settings?: {
    mode?: StoreMode;
    custom_message?: string | null;
    schedule?: WeeklySchedule;
  } | null,
  date: Date = new Date()
): StoreStatus {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
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
  const schedule = settings?.schedule ?? DEFAULT_WEEKLY_SCHEDULE;

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

  const autoOpen = isScheduleOpen(date, schedule);
  return {
    open: autoOpen,
    mode: "auto",
    nextLabel: customMessage || getScheduleNextLabel(date, schedule),
    customMessage,
  };
}

export function isStoreOpen(
  date: Date = new Date(),
  schedule: WeeklySchedule = DEFAULT_WEEKLY_SCHEDULE
): boolean {
  return isScheduleOpen(date, schedule);
}

export function getStoreStatus(
  date: Date = new Date(),
  schedule: WeeklySchedule = DEFAULT_WEEKLY_SCHEDULE
): StoreStatus {
  return resolveStoreStatus({ mode: "auto", schedule }, date);
}
