import type { DayKey, StoreProfile, WeeklySchedule } from "@/types/store";

export const STORE_NAME = "Don Luydd Pizzaria";
export const STORE_SHORT_NAME = "Don Luydd";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://pizzariadonluydd.valdeilsonlima.com.br";

export const STORE_TIMEZONE = "America/Fortaleza";

// Street & district only (no house number, postcode, coordinates or phone on storefront /)
export const STORE_STREET_DISTRICT = "Av. Epitácio Pessoa, Centro";
export const STORE_CITY = "João Pessoa";
export const STORE_MAP_URL =
  "https://www.openstreetmap.org/search?query=Av.%20Epitacio%20Pessoa%20Centro%20Joao%20Pessoa";

// Operational pickup address, WhatsApp & PIX used strictly in ordering flow, tracking & kitchen receipts
export const STORE_PICKUP_ADDRESS =
  process.env.NEXT_PUBLIC_PICKUP_ADDRESS ||
  "Av. Epitácio Pessoa, 1200 - Centro";

export const STORE_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5583993740352";

export const STORE_WHATSAPP_DISPLAY = "(83) 99374-0352";
export const STORE_PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY || "83993740352";
export const STORE_PIX_KEY_FORMATTED = "(83) 99374-0352";

export const STORE_INSTAGRAM_URL =
  "https://www.instagram.com/pizzariadonluydd/";
export const STORE_INSTAGRAM_HANDLE = "@pizzariadonluydd";

export const STORE_OVEN_LABEL = "Forno elétrico";
export const STORE_HOURS_LABEL = "Terça a domingo, 18h às 22h";
export const STORE_HOURS_SHORT = "Ter–Dom · 18h às 22h";

export const WEEKDAY_ORDER: DayKey[] = ["1", "2", "3", "4", "5", "6", "0"];

export const WEEKDAY_NAMES: Record<
  DayKey,
  { full: string; short: string; lower: string }
> = {
  "0": { full: "Domingo", short: "Dom", lower: "domingo" },
  "1": { full: "Segunda-feira", short: "Seg", lower: "segunda" },
  "2": { full: "Terça-feira", short: "Ter", lower: "terça" },
  "3": { full: "Quarta-feira", short: "Qua", lower: "quarta" },
  "4": { full: "Quinta-feira", short: "Qui", lower: "quinta" },
  "5": { full: "Sexta-feira", short: "Sex", lower: "sexta" },
  "6": { full: "Sábado", short: "Sáb", lower: "sábado" },
};

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  "0": { enabled: true, open: "18:00", close: "22:00" },
  "1": { enabled: false, open: "18:00", close: "22:00" },
  "2": { enabled: true, open: "18:00", close: "22:00" },
  "3": { enabled: true, open: "18:00", close: "22:00" },
  "4": { enabled: true, open: "18:00", close: "22:00" },
  "5": { enabled: true, open: "18:00", close: "22:00" },
  "6": { enabled: true, open: "18:00", close: "22:00" },
};

export const DEFAULT_COMMON_REMOVALS = [
  "Sem Cebola",
  "Sem Azeitona",
  "Sem Tomate",
  "Sem Orégano",
];

export const DEFAULT_SWEET_REMOVALS = [
  "Sem Leite Condensado",
  "Sem Canela",
  "Sem Granulado",
];

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: STORE_NAME,
  pickupAddress: STORE_PICKUP_ADDRESS,
  streetDistrict: STORE_STREET_DISTRICT,
  city: STORE_CITY,
  whatsappNumber: STORE_WHATSAPP_NUMBER,
  whatsappDisplay: STORE_WHATSAPP_DISPLAY,
  instagramUrl: STORE_INSTAGRAM_URL,
  instagramHandle: STORE_INSTAGRAM_HANDLE,
  pixKey: STORE_PIX_KEY,
  pixKeyDisplay: STORE_PIX_KEY_FORMATTED,
  pixKeyType: "Telefone",
  pixRecipient: STORE_NAME,
  ovenLabel: STORE_OVEN_LABEL,
  estimatedDelivery: "35–50 min",
  estimatedPickup: "20–30 min",
  schedule: DEFAULT_WEEKLY_SCHEDULE,
  commonRemovals: [...DEFAULT_COMMON_REMOVALS],
  sweetRemovals: [...DEFAULT_SWEET_REMOVALS],
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function sanitizeTime(value: unknown, fallback: string): string {
  if (typeof value === "string" && TIME_RE.test(value.trim())) {
    return value.trim();
  }
  return fallback;
}

export function normalizeWeeklySchedule(raw: unknown): WeeklySchedule {
  const input =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const keys: DayKey[] = ["0", "1", "2", "3", "4", "5", "6"];
  const result = {} as WeeklySchedule;

  for (const key of keys) {
    const def = DEFAULT_WEEKLY_SCHEDULE[key];
    const entry = input[key];
    if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      result[key] = {
        enabled: typeof obj.enabled === "boolean" ? obj.enabled : def.enabled,
        open: sanitizeTime(obj.open, def.open),
        close: sanitizeTime(obj.close, def.close),
      };
    } else {
      result[key] = { ...def };
    }
  }
  return result;
}

export function normalizeStringList(
  raw: unknown,
  fallback: string[]
): string[] {
  if (!Array.isArray(raw)) return [...fallback];
  const cleaned = raw
    .map((item) => (typeof item === "string" ? item.trim().slice(0, 60) : ""))
    .filter(Boolean);
  return cleaned;
}

function cleanStr(value: unknown, fallback: string, maxLen = 160): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed || fallback;
}

export function normalizeStoreProfile(
  raw?: Record<string, unknown> | Partial<StoreProfile> | null
): StoreProfile {
  const src = (raw ?? {}) as Record<string, unknown>;

  const rawWhatsapp =
    typeof src.whatsappNumber === "string"
      ? src.whatsappNumber
      : typeof src.whatsapp_number === "string"
        ? src.whatsapp_number
        : DEFAULT_STORE_PROFILE.whatsappNumber;
  const whatsappDigits =
    rawWhatsapp.replace(/\D/g, "").slice(0, 15) ||
    DEFAULT_STORE_PROFILE.whatsappNumber;

  const instagramUrlRaw = cleanStr(
    src.instagramUrl ?? src.instagram_url,
    DEFAULT_STORE_PROFILE.instagramUrl,
    240
  );
  const safeInstagramUrl = /^https?:\/\//i.test(instagramUrlRaw)
    ? instagramUrlRaw
    : DEFAULT_STORE_PROFILE.instagramUrl;

  return {
    storeName: cleanStr(
      src.storeName ?? src.store_name,
      DEFAULT_STORE_PROFILE.storeName,
      80
    ),
    pickupAddress: cleanStr(
      src.pickupAddress ?? src.pickup_address,
      DEFAULT_STORE_PROFILE.pickupAddress,
      180
    ),
    streetDistrict: cleanStr(
      src.streetDistrict ?? src.street_district,
      DEFAULT_STORE_PROFILE.streetDistrict,
      140
    ),
    city: cleanStr(src.city, DEFAULT_STORE_PROFILE.city, 80),
    whatsappNumber: whatsappDigits,
    whatsappDisplay: cleanStr(
      src.whatsappDisplay ?? src.whatsapp_display,
      DEFAULT_STORE_PROFILE.whatsappDisplay,
      40
    ),
    instagramUrl: safeInstagramUrl,
    instagramHandle: cleanStr(
      src.instagramHandle ?? src.instagram_handle,
      DEFAULT_STORE_PROFILE.instagramHandle,
      60
    ),
    pixKey: cleanStr(
      src.pixKey ?? src.pix_key,
      DEFAULT_STORE_PROFILE.pixKey,
      120
    ),
    pixKeyDisplay: cleanStr(
      src.pixKeyDisplay ?? src.pix_key_display ?? src.pixKey ?? src.pix_key,
      DEFAULT_STORE_PROFILE.pixKeyDisplay,
      120
    ),
    pixKeyType: cleanStr(
      src.pixKeyType ?? src.pix_key_type,
      DEFAULT_STORE_PROFILE.pixKeyType,
      40
    ),
    pixRecipient: cleanStr(
      src.pixRecipient ?? src.pix_recipient,
      DEFAULT_STORE_PROFILE.pixRecipient,
      100
    ),
    ovenLabel: cleanStr(
      src.ovenLabel ?? src.oven_label,
      DEFAULT_STORE_PROFILE.ovenLabel,
      60
    ),
    estimatedDelivery: cleanStr(
      src.estimatedDelivery ?? src.estimated_delivery,
      DEFAULT_STORE_PROFILE.estimatedDelivery,
      40
    ),
    estimatedPickup: cleanStr(
      src.estimatedPickup ?? src.estimated_pickup,
      DEFAULT_STORE_PROFILE.estimatedPickup,
      40
    ),
    schedule: normalizeWeeklySchedule(src.schedule),
    commonRemovals: normalizeStringList(
      src.commonRemovals ?? src.common_removals,
      DEFAULT_COMMON_REMOVALS
    ),
    sweetRemovals: normalizeStringList(
      src.sweetRemovals ?? src.sweet_removals,
      DEFAULT_SWEET_REMOVALS
    ),
  };
}
