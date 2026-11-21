export type PizzaCategory = "salgada" | "doce";

export interface Pizza {
  id: string;
  slug: string;
  name: string;
  desc: string;
  p: number;
  m: number;
  g: number;
  category: PizzaCategory;
  imgIdx: number;
  image?: string;
  tags: string[];
  highlight?: boolean;
  available?: boolean;
  sortOrder?: number;
}

export interface Drink {
  id: string;
  slug?: string;
  name: string;
  icon: string;
  price: number;
  desc: string;
  image?: string;
  tags: string[];
  available?: boolean;
  sortOrder?: number;
}

export interface ComboPizzaSlot {
  label: string;
  category: PizzaCategory;
  size: "P" | "M" | "G";
  allowHalf: boolean;
}

export interface ComboDrinkSlot {
  label: string;
  options: string[];
}

export interface Combo {
  id: string;
  slug?: string;
  name: string;
  desc: string;
  price: number;
  originalPrice: number;
  items: string[];
  image?: string;
  pizzaSlots: ComboPizzaSlot[];
  drinkSlots?: ComboDrinkSlot[];
  fixedDrinkLabel?: string;
  available?: boolean;
  sortOrder?: number;
}

export interface CartItemFlavor {
  name: string;
  price: number;
}

export interface CrustOption {
  id: string;
  slug?: string;
  name: string;
  price: number;
  compatibleWith: PizzaCategory[];
  available?: boolean;
  sortOrder?: number;
}

export interface ExtraIngredient {
  id: string;
  slug?: string;
  name: string;
  price: number;
  compatibleWith: PizzaCategory[];
  available?: boolean;
  sortOrder?: number;
}

export interface DeliveryBairro {
  id?: string;
  nome: string;
  frete: number;
  active?: boolean;
  sortOrder?: number;
}

export interface CatalogSnapshot {
  source: "supabase" | "memory" | "defaults";
  supabaseConnected: boolean;
  hasServiceRoleKey: boolean;
  needsSeed: boolean;
  pizzas: Pizza[];
  drinks: Drink[];
  combos: Combo[];
  crusts: CrustOption[];
  extras: ExtraIngredient[];
  bairros: DeliveryBairro[];
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
  whatsappNotifications: boolean;
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
