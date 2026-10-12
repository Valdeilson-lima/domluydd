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
    <div className="fixed bottom-0 left-0 right-0 z-250 animate-[slideUp_0.35s_cubic-bezier(0.16,1,0.3,1)] pointer-events-none">
      <div className="mx-auto max-w-280 px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-auto">
        <button
          onClick={onOpen}
          type="button"
          className="group flex w-full cursor-pointer items-center justify-between gap-3.5 rounded-2xl border border-yellow/30 bg-linear-to-r from-red-dark via-red-light to-orange p-3 text-cream shadow-[0_12px_32px_rgba(217,4,22,0.45)] ring-1 ring-white/10 transition-all duration-300 hover:brightness-110 hover:shadow-[0_16px_40px_rgba(242,135,5,0.5)] active:scale-[0.98] sm:p-3.5"
        >
          {/* Left: Bag icon + count */}
          <div className="flex items-center gap-3">
            <div className="relative flex size-11 items-center justify-center rounded-xl bg-black/40 text-yellow shadow-inner">
              <ShoppingBag className="size-5.5 transition-transform duration-200 group-hover:scale-110" />
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-yellow font-mono text-[0.62rem] font-bold text-black ring-2 ring-white animate-[popIn_0.3s_cubic-bezier(0.22,1,0.36,1)]">
                {itemCount}
              </span>
            </div>

            <div className="text-left">
              <span className="block font-mono text-[0.6rem] font-bold uppercase tracking-wider text-cream/80">
                {itemCount}{" "}
                {itemCount === 1 ? "item no pedido" : "itens no pedido"}
              </span>
              <span className="block font-display text-lg font-bold leading-none text-cream sm:text-xl">
                R$ {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Right: Action pill */}
          <div className="flex items-center gap-2 rounded-xl bg-black/35 px-4 py-2 font-body text-xs font-bold text-cream backdrop-blur-sm transition-colors group-hover:bg-black/50 sm:text-sm">
            <span>Ver sacola</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </button>
      </div>
    </div>
  );
}
