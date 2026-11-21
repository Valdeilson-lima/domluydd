"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { computeOvenSummary } from "@/features/admin/utils";
import type { DbOrder } from "@/types/supabase";

interface OvenSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: DbOrder[];
}

export function OvenSummaryModal({
  open,
  onOpenChange,
  orders,
}: OvenSummaryModalProps) {
  const summary = computeOvenSummary(orders);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resumo do forno e bancada</DialogTitle>
          <DialogDescription>
            Total acumulado nos pedidos Novos e Em preparo (
            {summary.totalPizzas} pizzas na fila; meias contam como 0,5).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Massas por tamanho
            </h3>
            {summary.sizes.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma massa na fila agora.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {summary.sizes.map(([size, count]) => (
                  <div
                    key={size}
                    className="border border-foreground bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    Tam. {size}:{" "}
                    <span className="font-mono font-bold">{count}x</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sabores solicitados
            </h3>
            {summary.flavors.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sem sabores pendentes.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {summary.flavors.map(([name, qty]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between border border-border bg-card px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-foreground">{name}</span>
                    <span className="font-mono font-bold text-foreground">
                      {qty}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {summary.crusts.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bordas recheadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.crusts.map(([name, qty]) => (
                  <span
                    key={name}
                    className="border border-border bg-card px-3 py-1.5 text-xs font-semibold"
                  >
                    {name} · <span className="font-mono">{qty}x</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {(summary.combos.length > 0 || summary.drinks.length > 0) && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Combos e bebidas
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {[...summary.combos, ...summary.drinks].map(([name, qty]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between border border-border bg-card px-3 py-2 text-xs"
                  >
                    <span>{name}</span>
                    <span className="font-mono font-bold">{qty}x</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {summary.observations.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações de preparo
              </h3>
              <ul className="space-y-1.5 text-xs">
                {summary.observations.map((obs, idx) => (
                  <li
                    key={`${obs.orderId}-${idx}`}
                    className="border border-border bg-secondary px-3 py-2"
                  >
                    <strong>
                      #{obs.orderId} ({obs.customer}):
                    </strong>{" "}
                    {obs.note}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
