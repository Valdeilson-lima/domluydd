import type { CartItem } from "./index";

export type OrderStatus =
  "pending" | "preparing" | "delivering" | "completed" | "cancelled";

export interface DbOrder {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string | null;
  delivery_type: "delivery" | "takeaway";
  address: string | null;
  bairro: string | null;
  cep: string | null;
  complement: string | null;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  change_for: number | null;
  status: OrderStatus;
  notes?: string | null;
}
