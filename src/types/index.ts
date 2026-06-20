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
}

export interface ModalState {
  pizza: Pizza | null;
  size: string;
  flavor1: string;
  flavor2: string;
  category: string;
}
