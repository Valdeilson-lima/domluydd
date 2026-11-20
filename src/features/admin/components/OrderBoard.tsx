"use client";

import { OrderCard } from "@/features/admin/components/OrderCard";
import type { OrderFilter, ViewMode } from "@/features/admin/types";
import type { DbOrder, OrderStatus } from "@/types/supabase";

interface OrderBoardProps {
  orders: DbOrder[];
  viewMode: ViewMode;
  filter: OrderFilter;
  onFilterChange: (filter: OrderFilter) => void;
  nowMs: number;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onRequestCancel: (order: DbOrder) => void;
  onPrint: (order: DbOrder) => void;
}

const KANBAN_COLUMNS: Array<{ status: OrderStatus; title: string }> = [
  { status: "pending", title: "Novos" },
  { status: "preparing", title: "Em preparo no forno" },
  { status: "delivering", title: "Saiu / Pronto balcão" },
];

export function OrderBoard({
  orders,
  viewMode,
  filter,
  onFilterChange,
  nowMs,
  onUpdateStatus,
  onRequestCancel,
  onPrint,
}: OrderBoardProps) {
  if (viewMode === "kanban") {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        {KANBAN_COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <section
              key={col.status}
              className="min-h-[220px] space-y-3 border border-border bg-secondary/40 p-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="font-serif text-xl font-normal text-foreground">
                  {col.title}
                </h2>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {columnOrders.length}
                </span>
              </div>

              {columnOrders.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Nenhum pedido nesta etapa.
                </p>
              ) : (
                <div className="space-y-3">
                  {columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      nowMs={nowMs}
                      onUpdateStatus={onUpdateStatus}
                      onRequestCancel={onRequestCancel}
                      onPrint={onPrint}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  const visibleOrders = orders.filter((o) => {
    if (filter === "active") {
      return (
        o.status === "pending" ||
        o.status === "preparing" ||
        o.status === "delivering"
      );
    }
    if (filter === "completed") return o.status === "completed";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "active", label: "Em andamento" },
            { id: "completed", label: "Concluídos" },
            { id: "cancelled", label: "Cancelados" },
            { id: "all", label: "Todos" },
          ] as Array<{ id: OrderFilter; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={`h-9 border px-3 text-xs font-semibold ${
              filter === tab.id
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-secondary"
            }`}
            style={{ borderRadius: "2px" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum pedido encontrado neste filtro.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              nowMs={nowMs}
              onUpdateStatus={onUpdateStatus}
              onRequestCancel={onRequestCancel}
              onPrint={onPrint}
            />
          ))}
        </div>
      )}
    </div>
  );
}
