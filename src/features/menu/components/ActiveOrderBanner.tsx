"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Bike, Clock } from "lucide-react";
import { loadLastOrder, updateLastOrderStatus } from "@/lib/order-storage";
import { formatPrice } from "@/lib/utils";
import type { PastOrder } from "@/types";
import type { OrderStatus } from "@/types/supabase";

const STATUS_META: Record<OrderStatus, { label: string; icon: typeof Clock }> =
  {
    pending: {
      label: "Pedido enviado, aguardando confirmação da cozinha",
      icon: Clock,
    },
    preparing: {
      label: "Sua pizza está em preparo no forno elétrico",
      icon: Flame,
    },
    delivering: {
      label: "Pedido pronto ou a caminho do seu endereço",
      icon: Bike,
    },
    completed: { label: "Pedido finalizado", icon: Clock },
    cancelled: { label: "Pedido cancelado", icon: Clock },
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
        // keep local snapshot silently on transient network failure
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
  const meta = STATUS_META[currentStatus] || STATUS_META.pending;
  const StatusIcon = meta.icon;

  return (
    <div
      className="border-b border-foreground/20 bg-primary px-4 py-3 text-primary-foreground sm:px-6"
      role="region"
      aria-label="Pedido em andamento"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <StatusIcon className="size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-wider opacity-85 tabular-nums">
              Pedido #{activeOrder.id.slice(0, 8)} · R${" "}
              {formatPrice(activeOrder.total)}
            </p>
            <p className="text-sm font-semibold">{meta.label}</p>
          </div>
        </div>

        <Link
          href={`/pedido/${activeOrder.id}`}
          className="inline-flex min-h-11 items-center gap-1.5 bg-background px-4 text-xs font-semibold text-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]"
          style={{ borderRadius: "2px" }}
        >
          Acompanhar pedido
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
