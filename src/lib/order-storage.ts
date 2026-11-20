import type { PastOrder } from "@/types";

const CUSTOMER_STORAGE_KEY = "donluydd.customer.v1";
const LAST_ORDER_STORAGE_KEY = "donluydd.last_order.v1";

export interface SavedCustomerDraft {
  name?: string;
  phone?: string;
  deliveryType?: "delivery" | "takeaway";
  cep?: string;
  address?: string;
  complement?: string;
  bairro?: string;
  payment?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  paymentMethod?: string;
  trocoPara?: string;
  whatsappNotifications?: boolean;
}

export function loadCustomerDraft(): SavedCustomerDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCustomerDraft(draft: SavedCustomerDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota errors */
  }
}

export function clearCustomerDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function normalizePastOrder(raw: unknown): PastOrder | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== "string" || !Array.isArray(obj.items)) return null;

  const deliveryType: "delivery" | "takeaway" =
    obj.delivery_type === "takeaway" || obj.deliveryType === "takeaway"
      ? "takeaway"
      : "delivery";

  return {
    id: obj.id,
    date: typeof obj.date === "string" ? obj.date : new Date().toISOString(),
    customer_name:
      typeof obj.customer_name === "string" ? obj.customer_name : undefined,
    customer_phone:
      typeof obj.customer_phone === "string" ? obj.customer_phone : null,
    delivery_type: deliveryType,
    deliveryType,
    address: typeof obj.address === "string" ? obj.address : null,
    bairro: typeof obj.bairro === "string" ? obj.bairro : null,
    complement: typeof obj.complement === "string" ? obj.complement : null,
    cep: typeof obj.cep === "string" ? obj.cep : null,
    items: obj.items as PastOrder["items"],
    subtotal: typeof obj.subtotal === "number" ? obj.subtotal : undefined,
    delivery_fee:
      typeof obj.delivery_fee === "number" ? obj.delivery_fee : undefined,
    total: typeof obj.total === "number" ? obj.total : 0,
    payment_method:
      typeof obj.payment_method === "string" ? obj.payment_method : undefined,
    change_for: typeof obj.change_for === "number" ? obj.change_for : null,
    status:
      typeof obj.status === "string"
        ? (obj.status as PastOrder["status"])
        : "pending",
  };
}

export function loadLastOrder(): PastOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_ORDER_STORAGE_KEY);
    if (!raw) return null;
    return normalizePastOrder(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveLastOrder(order: PastOrder): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = normalizePastOrder(order);
    if (normalized) {
      localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    /* ignore */
  }
}

export function updateLastOrderStatus(
  orderId: string,
  newStatus: NonNullable<PastOrder["status"]>
): PastOrder | null {
  const current = loadLastOrder();
  if (!current || current.id !== orderId) return null;
  const updated: PastOrder = { ...current, status: newStatus };
  saveLastOrder(updated);
  return updated;
}
