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
      className={`space-y-3 border bg-card p-4 ${
        sla.isDelayed ? "border-2 border-foreground" : "border-border"
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
                    ? "inline-flex items-center gap-1 bg-primary px-1.5 py-0.5 font-semibold text-primary-foreground"
                    : sla.isWarning
                      ? "inline-flex items-center gap-1 border border-status-warn px-1.5 py-0.5 font-semibold text-status-warn"
                      : "inline-flex items-center gap-1"
                }
              >
                <Clock className="size-3" aria-hidden="true" />
                {sla.label}
              </span>
            )}
          </div>

          <h3 className="mt-1 font-serif text-lg font-normal text-foreground break-words">
            {order.customer_name}
          </h3>
          {order.customer_phone && (
            <p className="font-mono text-xs text-muted-foreground">
              {order.customer_phone}
            </p>
          )}
        </div>

        <span className="shrink-0 border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground">
          {STATUS_META[order.status]}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {isDelivery ? (
          <>
            <Bike
              className="size-3.5 shrink-0 text-foreground"
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
              className="size-3.5 shrink-0 text-foreground"
              aria-hidden="true"
            />
            <span className="font-semibold text-foreground">
              Retirada no balcão
            </span>
          </>
        )}
      </div>

      <ul className="space-y-2 border-t border-border pt-2.5 text-xs">
        {order.items.map((item, idx) => (
          <li
            key={`${item.id}-${idx}`}
            className="space-y-1 bg-background/75 p-2.5"
          >
            <div className="flex justify-between gap-2 font-semibold text-foreground">
              <span className="min-w-0 break-words">
                {item.qty}x {item.flavors.map((f) => f.name).join(" + ")} (
                {item.size})
              </span>
              <span className="shrink-0 font-mono tabular-nums">
                R$ {formatPrice(item.price * item.qty)}
              </span>
            </div>

            {item.crust && (
              <p className="text-[11px] font-semibold text-foreground">
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
                    className="inline-flex items-center gap-1 border border-foreground bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-foreground"
                  >
                    <AlertTriangle className="size-2.5" aria-hidden="true" />
                    {rem}
                  </span>
                ))}
              </div>
            )}
            {item.observation && (
              <p className="text-[11px] italic text-foreground">
                Obs.: {item.observation}
              </p>
            )}
          </li>
        ))}
      </ul>

      {order.status === "cancelled" && order.notes && (
        <p className="border border-foreground bg-secondary p-2 text-xs text-foreground">
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
        <span className="font-mono text-sm font-bold text-foreground tabular-nums">
          R$ {formatPrice(order.total)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {nextStep && (
          <button
            type="button"
            onClick={() => onUpdateStatus(order.id, nextStep.next)}
            className="min-h-11 flex-1 bg-primary px-3 text-xs font-semibold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]"
            style={{ borderRadius: "2px" }}
          >
            {nextStep.label}
          </button>
        )}

        <button
          type="button"
          onClick={() => onPrint(order)}
          className="inline-flex min-h-11 items-center gap-1.5 border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:border-foreground hover:bg-secondary"
          style={{ borderRadius: "2px" }}
          aria-label={`Imprimir comanda do pedido ${order.id.slice(0, 8)}`}
        >
          <Printer className="size-3.5" aria-hidden="true" />
          Comanda
        </button>

        {order.status !== "completed" && order.status !== "cancelled" && (
          <button
            type="button"
            onClick={() => onRequestCancel(order)}
            className="inline-flex min-h-11 items-center gap-1.5 border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            style={{ borderRadius: "2px" }}
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
