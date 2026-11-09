"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Flame,
  Bike,
  CheckCircle,
  X,
  ArrowRight,
  Receipt,
  Store,
} from "lucide-react";
import type { PastOrder } from "@/types";
import type { DbOrder } from "@/types/supabase";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface ActiveOrderBannerProps {
  order: PastOrder;
  onDismiss: () => void;
  onStatusUpdate?: (status: PastOrder["status"]) => void;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    badgeBg: string;
    dotColor: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: "Recebido na Cozinha",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    dotColor: "bg-amber-400",
    icon: Clock,
  },
  preparing: {
    label: "No Forno / Em Preparo",
    badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    dotColor: "bg-orange-400",
    icon: Flame,
  },
  delivering: {
    label: "Saiu para Entrega",
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    dotColor: "bg-blue-400",
    icon: Bike,
  },
  completed: {
    label: "Pedido Entregue",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    dotColor: "bg-emerald-400",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Pedido Cancelado",
    badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
    dotColor: "bg-red-400",
    icon: X,
  },
};

export function ActiveOrderBanner({
  order,
  onDismiss,
  onStatusUpdate,
}: ActiveOrderBannerProps) {
  const [currentStatus, setCurrentStatus] = useState<PastOrder["status"]>(
    order.status || "pending"
  );

  // 1. Sincronização inicial com a API
  useEffect(() => {
    async function syncStatus() {
      try {
        const res = await fetch("/api/orders");
        const json = await res.json();
        if (Array.isArray(json.orders)) {
          const found = json.orders.find((o: DbOrder) => o.id === order.id);
          if (found && found.status && found.status !== currentStatus) {
            setCurrentStatus(found.status);
            onStatusUpdate?.(found.status);
          }
        }
      } catch {
        /* ignore */
      }
    }
    syncStatus();
  }, [order.id, currentStatus, onStatusUpdate]);

  // 2. Inscrição em tempo real no Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel(`active-order-banner-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as DbOrder).status) {
            const nextStatus = (payload.new as DbOrder).status;
            setCurrentStatus(nextStatus);
            onStatusUpdate?.(nextStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, onStatusUpdate]);

  const statusCfg =
    STATUS_CONFIG[currentStatus || "pending"] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const itemsSummary =
    order.items && order.items.length > 0
      ? order.items
          .map(
            (it) => `${it.qty}x ${it.flavors.map((f) => f.name).join(" + ")}`
          )
          .join(", ")
      : "Pizzas e Bebidas";

  const isDelivery =
    order.delivery_type === "delivery" || order.deliveryType === "delivery";

  return (
    <aside
      aria-label="Aviso de pedido em andamento"
      className="relative z-60 border-b border-yellow/30 bg-linear-to-r from-[#211718] via-[#1a1213] to-[#151011] px-3 py-2.5 sm:px-6 sm:py-3 shadow-xl"
    >
      <div className="mx-auto flex max-w-280 flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Lado Esquerdo: Identificação e Resumo */}
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-yellow/15 text-yellow border border-yellow/30">
            <Receipt className="size-4.5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-bold italic text-cream">
                Olá, {order.customer_name || "Cliente"}!
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[0.62rem] font-bold ${statusCfg.badgeBg}`}
              >
                <span
                  className={`size-1.5 rounded-full ${statusCfg.dotColor} ${
                    currentStatus !== "completed" &&
                    currentStatus !== "cancelled"
                      ? "animate-pulse"
                      : ""
                  }`}
                />
                <StatusIcon className="size-3" />
                <span>{statusCfg.label}</span>
              </span>

              <span className="font-mono text-[0.65rem] text-muted">
                #{order.id.slice(0, 8)}
              </span>
            </div>

            <p className="text-xs text-cream-dim leading-snug line-clamp-1 max-w-xl">
              <strong>Seu pedido:</strong> {itemsSummary}
              {isDelivery ? (
                order.bairro ? (
                  ` · Entrega no ${order.bairro}`
                ) : (
                  ""
                )
              ) : (
                <span className="inline-flex items-center gap-1 ml-1 text-yellow">
                  <Store className="size-3" />
                  (Retirada no Balcão)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2 shrink-0">
          <Link
            href={`/pedido/${order.id}`}
            className="flex flex-1 md:flex-initial items-center justify-center gap-1.5 rounded-sm bg-linear-to-r from-red-primary to-yellow px-4 py-2 font-mono text-xs font-bold text-black shadow-md transition-all duration-200 hover:brightness-110 active:scale-95 cursor-pointer"
          >
            <span>Acompanhar ao Vivo</span>
            <ArrowRight className="size-3.5" />
          </Link>

          <button
            onClick={onDismiss}
            type="button"
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-white/10 bg-white/4 text-muted transition-colors hover:border-white/20 hover:text-cream active:scale-90"
            title="Ocultar este aviso"
            aria-label="Ocultar aviso de pedido ativo"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
