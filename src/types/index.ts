export interface Pizza {
  id: string;
  name: string;
  desc: string;
  p: number;
  m: number;
  g: number;
  category: "salgada" | "doce";
  imgIdx: number;
}

export interface Drink {
  name: string;
  icon: string;
  price: number;
  desc: string;
}

export interface CartItemFlavor {
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
}
