"use client";

import {
  Printer,
  XCircle,
  Bike,
  Store,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { getOrderSla } from "@/features/admin/utils";
import { formatPrice } from "@/lib/utils";
import type { DbOrder, OrderStatus } from "@/types/supabase";

interface OrderCardProps {
  order: DbOrder;
  nowMs: number;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onRequestCancel: (order: DbOrder) => void;
  onPrint: (order: DbOrder) => void;
}

const STATUS_META: Record<OrderStatus, string> = {
  pending: "Novo",
  preparing: "Preparo",
  delivering: "Saída",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const NEXT_ACTION: Partial<
  Record<OrderStatus, { next: OrderStatus; label: string }>
> = {
  pending: { next: "preparing", label: "Iniciar preparo" },
  preparing: { next: "delivering", label: "Saiu / Pronto" },
  delivering: { next: "completed", label: "Concluir" },
};

export function OrderCard({
  order,
  nowMs,
  onUpdateStatus,
  onRequestCancel,
  onPrint,
}: OrderCardProps) {
  const sla = getOrderSla(order, nowMs);
  const nextStep = NEXT_ACTION[order.status];
  const isDelivery = order.delivery_type === "delivery";
  const createdTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(order.created_at));

  return (
    <article
      className={`space-y-3 rounded-2xl border bg-card p-4 shadow-xs ${
        sla.isDelayed ? "border-2 border-primary" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground tabular-nums">
            <span>#{order.id.slice(0, 8)}</span>
            <span>· {createdTime}</span>
            {order.status !== "completed" && order.status !== "cancelled" && (
              <span
                className={
                  sla.isDelayed
                    ? "inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-bold text-primary-foreground"
                    : sla.isWarning
                      ? "inline-flex items-center gap-1 rounded-full bg-accent-gold-soft px-2 py-0.5 font-bold text-accent-gold-ink"
                      : "inline-flex items-center gap-1"
                }
              >
                <Clock className="size-3" aria-hidden="true" />
                {sla.label}
              </span>
            )}
          </div>

          <h3 className="mt-1 font-serif text-lg font-bold text-foreground break-words">
            {order.customer_name}
          </h3>
          {order.customer_phone && (
            <p className="font-mono text-xs text-muted-foreground">
              {order.customer_phone}
            </p>
          )}
        </div>

        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
          {STATUS_META[order.status]}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {isDelivery ? (
          <>
            <Bike
              className="size-3.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate">
              {order.address || "Entrega"}
              {order.bairro ? ` · ${order.bairro}` : ""}
              {order.complement ? ` (${order.complement})` : ""}
            </span>
          </>
        ) : (
          <>
            <Store
              className="size-3.5 shrink-0 text-status-open"
              aria-hidden="true"
            />
            <span className="font-bold text-foreground">
              Retirada no balcão
            </span>
          </>
        )}
      </div>

      <ul className="space-y-2 border-t border-border pt-2.5 text-xs">
        {order.items.map((item, idx) => (
          <li
            key={`${item.id}-${idx}`}
            className="space-y-1 rounded-xl bg-secondary/50 p-2.5"
          >
            <div className="flex justify-between gap-2 font-bold text-foreground">
              <span className="min-w-0 break-words">
                {item.qty}x {item.flavors.map((f) => f.name).join(" + ")} (
                {item.size})
              </span>
              <span className="shrink-0 tabular-nums">
                R$ {formatPrice(item.price * item.qty)}
              </span>
            </div>

            {item.crust && (
              <p className="text-[11px] font-bold text-accent-gold-ink">
                Borda: {item.crust.name}
              </p>
            )}
            {item.extras && item.extras.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Extras: {item.extras.map((e) => e.name).join(", ")}
              </p>
            )}
            {item.removals && item.removals.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {item.removals.map((rem) => (
                  <span
                    key={rem}
                    className="inline-flex items-center gap-1 rounded-full bg-accent-gold-soft px-2 py-0.5 text-[10px] font-bold uppercase text-accent-gold-ink"
                  >
                    <AlertTriangle className="size-2.5" aria-hidden="true" />
                    {rem}
                  </span>
                ))}
              </div>
            )}
            {item.observation && (
              <p className="text-[11px] font-medium text-foreground">
                {item.category === "combo"
                  ? item.observation
                  : `Obs.: ${item.observation}`}
              </p>
            )}
          </li>
        ))}
      </ul>

      {order.status === "cancelled" && order.notes && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          <strong>Cancelado:</strong> {order.notes}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs">
        <span className="text-muted-foreground">
          {order.payment_method}
          {order.change_for
            ? ` (troco R$ ${formatPrice(order.change_for)})`
            : ""}
        </span>
        <span className="text-sm font-extrabold text-foreground tabular-nums">
          R$ {formatPrice(order.total)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {nextStep && (
          <button
            type="button"
            onClick={() => onUpdateStatus(order.id, nextStep.next)}
            className="min-h-11 flex-1 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-xs transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.98]"
          >
            {nextStep.label}
          </button>
        )}

        <button
          type="button"
          onClick={() => onPrint(order)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
          aria-label={`Imprimir comanda do pedido ${order.id.slice(0, 8)}`}
        >
          <Printer className="size-3.5" aria-hidden="true" />
          Comanda
        </button>

        {order.status !== "completed" && order.status !== "cancelled" && (
          <button
            type="button"
            onClick={() => onRequestCancel(order)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Cancelar pedido ${order.id.slice(0, 8)}`}
          >
            <XCircle className="size-3.5" aria-hidden="true" />
            Cancelar
          </button>
        )}
      </div>
    </article>
  );
}
