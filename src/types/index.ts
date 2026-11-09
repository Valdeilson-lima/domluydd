export interface Pizza {
  id: string;
  slug: string;
  name: string;
  desc: string;
  p: number;
  m: number;
  g: number;
  category: "salgada" | "doce";
  imgIdx: number;
  available?: boolean;
}

export interface Drink {
  name: string;
  icon: string;
  price: number;
  desc: string;
  available?: boolean;
}

export interface Combo {
  id: string;
  name: string;
  desc: string;
  price: number;
  originalPrice: number;
  items: string[];
  available?: boolean;
}

export interface CartItemFlavor {
  name: string;
  price: number;
}

export interface CrustOption {
  id: string;
  name: string;
  price: number;
}

export interface ExtraIngredient {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: number;
  flavors: CartItemFlavor[];
  size: string;
  price: number;
  category: string;
  qty: number;
  observation?: string;
  crust?: { name: string; price: number };
  extras?: Array<{ name: string; price: number }>;
  removals?: string[];
}

export interface CustomerData {
  name: string;
  phone: string;
  deliveryType: "delivery" | "takeaway";
  cep: string;
  bairro: string;
  rua: string;
  numero: string;
  complemento: string;
  paymentMethod: string;
  trocoPara: string;
}

export interface PastOrder {
  id: string;
  date: string;
  customer_name?: string;
  customer_phone?: string | null;
  deliveryType?: "delivery" | "takeaway";
  delivery_type?: "delivery" | "takeaway";
  address?: string | null;
  bairro?: string | null;
  complement?: string | null;
  cep?: string | null;
  items: CartItem[];
  subtotal?: number;
  delivery_fee?: number;
  total: number;
  payment_method?: string;
  change_for?: number | null;
  status?: "pending" | "preparing" | "delivering" | "completed" | "cancelled";
}
