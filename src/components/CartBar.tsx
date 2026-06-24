import { ShoppingBag, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CartBarProps {
  itemCount: number;
  total: number;
  onOpen: () => void;
  hidden?: boolean;
}

export function CartBar({ itemCount, total, onOpen, hidden }: CartBarProps) {
  if (itemCount === 0 || hidden) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-250 animate-[slideUp_0.3s_ease]">
      <div className="mx-auto max-w-280 px-3 pb-3 sm:px-5 sm:pb-5">
        <button
          onClick={onOpen}
          className="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-linear-to-r from-red-dark to-red-primary px-5 py-3.5 text-cream shadow-lg ring-1 ring-yellow/20 transition-all duration-200 hover:shadow-xl hover:ring-yellow/40 active:scale-[0.98] sm:py-4"
        >
          <div className="relative flex shrink-0 items-center">
            <ShoppingBag className="size-5 sm:size-6" />
            <span className="absolute -right-1.5 -top-1.5 flex size-4.5 items-center justify-center rounded-full bg-yellow text-[0.6rem] font-bold text-black animate-[popIn_0.3s_cubic-bezier(0.22,1,0.36,1)] sm:size-5 sm:text-[0.65rem]">
              {itemCount}
            </span>
          </div>

          <div className="flex-1 text-left">
            <div className="font-mono text-[0.6rem] uppercase tracking-wider opacity-75 sm:text-[0.65rem]">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </div>
            <div className="font-body text-base font-bold leading-tight sm:text-lg">
              R$ {formatPrice(total)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-[10px] bg-white/10 px-3.5 py-2 text-sm font-bold transition-colors duration-200 group-hover:bg-white/15 sm:text-base">
            Ver carrinho
            <ArrowRight className="size-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
