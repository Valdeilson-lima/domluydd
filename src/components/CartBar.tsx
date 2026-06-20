import { ShoppingBag } from "lucide-react";
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
    <div className="fixed bottom-0 left-0 right-0 z-[250] animate-[slideUp_0.3s_ease]">
      <div className="mx-auto max-w-[1120px] px-3 pb-3 sm:px-5 sm:pb-5">
        <button
          onClick={onOpen}
          className="flex w-full cursor-pointer items-center gap-3 rounded-[14px] bg-gradient-to-r from-red-primary to-red-dark px-5 py-3.5 text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] sm:py-4"
        >
          <div className="relative">
            <ShoppingBag className="size-5 sm:size-6" />
            <span className="absolute -right-1.5 -top-1.5 flex size-[18px] items-center justify-center rounded-full bg-yellow-light text-[0.6rem] font-bold text-black animate-[popIn_0.3s_cubic-bezier(0.22,1,0.36,1)] sm:size-5 sm:text-[0.65rem]">
              {itemCount}
            </span>
          </div>

          <div className="flex-1 text-left">
            <div className="text-xs font-semibold opacity-80 sm:text-sm">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </div>
            <div className="text-sm font-bold sm:text-base">
              Total: R$ {formatPrice(total)}
            </div>
          </div>

          <div className="rounded-[10px] bg-white/15 px-4 py-2 text-sm font-bold transition-colors duration-200 hover:bg-white/20 sm:text-base">
            Ver carrinho
          </div>
        </button>
      </div>
    </div>
  );
}
