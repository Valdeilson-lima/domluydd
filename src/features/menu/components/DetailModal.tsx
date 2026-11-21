"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PizzaConfigurator } from "@/features/menu/components/PizzaConfigurator";
import type { PizzaSizeKey } from "@/lib/pricing";
import type { CartItem, CrustOption, ExtraIngredient, Pizza } from "@/types";

interface DetailModalProps {
  pizza: Pizza | null;
  allPizzas?: Pizza[];
  crusts?: CrustOption[];
  extras?: ExtraIngredient[];
  commonRemovals?: string[];
  sweetRemovals?: string[];
  initialSize?: PizzaSizeKey;
  initialHalf?: boolean;
  onClose: () => void;
  isPaused: (name: string) => boolean;
  onAddToCart: (item: Omit<CartItem, "id" | "qty"> & { qty: number }) => void;
}

export function DetailModal({
  pizza,
  allPizzas,
  crusts,
  extras,
  commonRemovals,
  sweetRemovals,
  initialSize = "m",
  initialHalf = false,
  onClose,
  isPaused,
  onAddToCart,
}: DetailModalProps) {
  return (
    <Dialog open={Boolean(pizza)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {pizza && (
          <>
            <DialogHeader>
              <DialogTitle>{pizza.name}</DialogTitle>
              <DialogDescription>{pizza.desc}</DialogDescription>
            </DialogHeader>

            <PizzaConfigurator
              key={`${pizza.id}-${initialSize}-${initialHalf}`}
              pizza={pizza}
              allPizzas={allPizzas}
              crusts={crusts}
              extras={extras}
              commonRemovals={commonRemovals}
              sweetRemovals={sweetRemovals}
              initialSize={initialSize}
              initialHalf={initialHalf}
              isPaused={isPaused}
              onConfirm={(item) => {
                onAddToCart(item);
                onClose();
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
