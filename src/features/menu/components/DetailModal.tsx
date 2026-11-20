"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PizzaConfigurator } from "@/features/menu/components/PizzaConfigurator";
import type { CartItem, Pizza } from "@/types";

interface DetailModalProps {
  pizza: Pizza | null;
  onClose: () => void;
  isPaused: (name: string) => boolean;
  onAddToCart: (item: Omit<CartItem, "id" | "qty"> & { qty: number }) => void;
}

export function DetailModal({
  pizza,
  onClose,
  isPaused,
  onAddToCart,
}: DetailModalProps) {
  return (
    <Dialog open={Boolean(pizza)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border border-border bg-background text-foreground p-6">
        {pizza && (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="font-serif text-2xl font-normal text-foreground">
                {pizza.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {pizza.desc}
              </DialogDescription>
            </DialogHeader>

            <PizzaConfigurator
              key={pizza.id}
              pizza={pizza}
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
