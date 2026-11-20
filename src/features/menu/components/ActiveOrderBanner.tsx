"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { loadLastOrder, updateLastOrderStatus } from "@/lib/order-storage";
import { formatPrice } from "@/lib/utils";
import type { PastOrder } from "@/types";
import type { OrderStatus } from "@/types/supabase";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pedido enviado — aguardando confirmação da cozinha",
  preparing: "Sua pizza está em preparo no forno",
  delivering: "Pedido a caminho do seu endereço",
  completed: "Pedido finalizado",
  cancelled: "Pedido cancelado",
};

export function ActiveOrderBanner() {
  const [activeOrder, setActiveOrder] = useState<PastOrder | null>(null);

  useEffect(() => {
    const stored = loadLastOrder();
    if (!stored?.id) return;
    if (stored.status === "completed" || stored.status === "cancelled") return;

    setActiveOrder(stored);

    let cancelled = false;
    const syncSingleOrder = async () => {
      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(stored.id)}`,
          {
            cache: "no-store",
          }
        );
        if (!res.ok || cancelled) return;
        const fresh = await res.json();
        const nextStatus = fresh?.status as OrderStatus | undefined;
        if (!nextStatus) return;

        updateLastOrderStatus(stored.id, nextStatus);
        if (nextStatus === "completed" || nextStatus === "cancelled") {
          setActiveOrder(null);
        } else {
          setActiveOrder((prev) =>
            prev ? { ...prev, status: nextStatus } : null
          );
        }
      } catch {
        // keep local snapshot silently on network hiccup
      }
    };

    syncSingleOrder();
    const timer = window.setInterval(syncSingleOrder, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!activeOrder) return null;

  const currentStatus = (activeOrder.status ?? "pending") as OrderStatus;

  return (
    <div
      className="border-b border-border bg-secondary px-4 py-3 sm:px-6"
      role="region"
      aria-label="Pedido em andamento"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pedido #{activeOrder.id.slice(0, 8)} · R${" "}
            {formatPrice(activeOrder.total)}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {STATUS_LABELS[currentStatus] || "Acompanhar pedido"}
          </p>
        </div>

        <Link
          href={`/pedido/${activeOrder.id}`}
          className="inline-flex h-11 items-center gap-1.5 border border-foreground bg-background px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
          style={{ borderRadius: "2px" }}
        >
          Acompanhar
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
