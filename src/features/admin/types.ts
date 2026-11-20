import type { DbOrder } from "@/types/supabase";

export type OrderFilter = "active" | "all" | "completed" | "cancelled";
export type ViewMode = "kanban" | "grid";
export type ClosingScope = "today" | "all";

export interface SlaInfo {
  elapsedMinutes: number;
  isDelayed: boolean;
  isWarning: boolean;
  label: string;
}

export interface OvenSummaryData {
  sizes: Array<[string, number]>;
  flavors: Array<[string, number]>;
  crusts: Array<[string, number]>;
  drinks: Array<[string, number]>;
  combos: Array<[string, number]>;
  totalPizzas: number;
  observations: Array<{ orderId: string; customer: string; note: string }>;
}

export interface PaymentBreakdownBucket {
  count: number;
  total: number;
}

export interface CashClosingStats {
  totalOrders: number;
  validOrders: DbOrder[];
  cancelledOrders: DbOrder[];
  totalRevenue: number;
  totalDeliveryFees: number;
  averageTicket: number;
  deliveryCount: number;
  takeawayCount: number;
  payments: {
    pix: PaymentBreakdownBucket;
    cartao: PaymentBreakdownBucket;
    dinheiro: PaymentBreakdownBucket;
    outro: PaymentBreakdownBucket;
  };
  topFlavors: Array<[string, number]>;
}
