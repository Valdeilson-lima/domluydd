"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { computeCashClosingStats } from "@/features/admin/utils";
import type { ClosingScope } from "@/features/admin/types";
import type { ClosingReportData } from "@/lib/escpos";
import { formatPrice } from "@/lib/utils";
import type { DbOrder } from "@/types/supabase";

interface CashClosingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: DbOrder[];
  onPrintClosing: (report: ClosingReportData) => Promise<void>;
}

export function CashClosingModal({
  open,
  onOpenChange,
  orders,
  onPrintClosing,
}: CashClosingModalProps) {
  const [scope, setScope] = useState<ClosingScope>("today");
  const stats = computeCashClosingStats(orders, scope);

  const handlePrint = async () => {
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat("pt-BR").format(now);
    const report: ClosingReportData = {
      generatedAt: new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now),
      dateStr:
        scope === "today"
          ? formattedDate
          : `Histórico completo (${formattedDate})`,
      totalSales: stats.totalRevenue,
      orderCount: stats.validOrders.length,
      averageTicket: stats.averageTicket,
      paymentBreakdown: stats.payments,
      deliveryCount: stats.deliveryCount,
      takeawayCount: stats.takeawayCount,
      totalDeliveryFees: stats.totalDeliveryFees,
      cancelledCount: stats.cancelledOrders.length,
    };
    await onPrintClosing(report);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechamento de caixa</DialogTitle>
          <DialogDescription>
            Faturamento válido (excluindo cancelamentos), formas de pagamento e
            taxas de entrega.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScope("today")}
              className={`min-h-11 rounded-xl border px-4 text-xs font-bold transition-colors ${
                scope === "today"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              Turno de hoje
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`min-h-11 rounded-xl border px-4 text-xs font-bold transition-colors ${
                scope === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              Todo histórico carregado
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Faturamento
              </p>
              <p className="mt-1 text-lg font-extrabold text-primary tabular-nums">
                R$ {formatPrice(stats.totalRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Pedidos válidos
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums">
                {stats.validOrders.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Ticket médio
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums">
                R$ {formatPrice(stats.averageTicket)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cancelados
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums">
                {stats.cancelledOrders.length}
              </p>
            </div>
          </div>

          <section className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Totais por pagamento e logística
            </h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between border-b border-border pb-1">
                <dt>Pix ({stats.payments.pix.count}x)</dt>
                <dd className="font-bold tabular-nums">
                  R$ {formatPrice(stats.payments.pix.total)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-border pb-1">
                <dt>Cartão ({stats.payments.cartao.count}x)</dt>
                <dd className="font-bold tabular-nums">
                  R$ {formatPrice(stats.payments.cartao.total)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-border pb-1">
                <dt>Dinheiro ({stats.payments.dinheiro.count}x)</dt>
                <dd className="font-bold tabular-nums">
                  R$ {formatPrice(stats.payments.dinheiro.total)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-border pb-1">
                <dt>
                  Taxas entrega ({stats.deliveryCount} ent. /{" "}
                  {stats.takeawayCount} ret.)
                </dt>
                <dd className="font-bold tabular-nums">
                  R$ {formatPrice(stats.totalDeliveryFees)}
                </dd>
              </div>
            </dl>
          </section>

          {stats.topFlavors.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sabores mais vendidos no período
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {stats.topFlavors.map(([name, qty]) => (
                  <div
                    key={name}
                    className="flex justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs"
                  >
                    <span className="font-semibold">{name}</span>
                    <span className="font-mono font-bold">{qty}x</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir fechamento de caixa
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
