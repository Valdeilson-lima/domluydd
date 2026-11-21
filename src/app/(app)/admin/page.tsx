"use client";

import { useState, useEffect, useMemo } from "react";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { useStock } from "@/hooks/useStock";
import { useAdminOrders } from "@/features/admin/hooks/useAdminOrders";
import { useAdminPrinter } from "@/features/admin/hooks/useAdminPrinter";
import { AdminLogin } from "@/features/admin/components/AdminLogin";
import { AdminHeader } from "@/features/admin/components/AdminHeader";
import { OrderBoard } from "@/features/admin/components/OrderBoard";
import { OvenSummaryModal } from "@/features/admin/components/OvenSummaryModal";
import { CashClosingModal } from "@/features/admin/components/CashClosingModal";
import { StockModal } from "@/features/admin/components/StockModal";
import { StoreStatusModal } from "@/features/admin/components/StoreStatusModal";
import { CancelOrderModal } from "@/features/admin/components/CancelOrderModal";
import { computeCashClosingStats, getOrderSla } from "@/features/admin/utils";
import type { OrderFilter, ViewMode } from "@/features/admin/types";
import { formatPrice, normalizeText } from "@/lib/utils";
import type { DbOrder } from "@/types/supabase";

export default function AdminKdsPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [filter, setFilter] = useState<OrderFilter>("active");
  const [search, setSearch] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<DbOrder | null>(null);

  const {
    isOpen: isStoreOpen,
    mode: storeMode,
    customMessage,
    isAutoOpen,
    updateStatus: updateStoreStatus,
  } = useStoreStatus();
  const { isPaused, toggleStock } = useStock();
  const {
    usbDevice,
    autoPrint,
    setAutoPrint,
    printerError,
    connectUsbPrinter,
    printOrder,
    printClosingReport,
  } = useAdminPrinter();

  useEffect(() => {
    let active = true;
    fetch("/api/admin/auth", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (active) setAuthenticated(Boolean(data?.authenticated));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const ticker = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(ticker);
  }, []);

  const {
    orders,
    loading,
    error,
    soundEnabled,
    setSoundEnabled,
    refresh,
    updateOrderStatus,
  } = useAdminOrders({
    enabled: authenticated,
    onUnauthorized: () => setAuthenticated(false),
    onNewOrder: (incoming) => {
      if (autoPrint) {
        printOrder(incoming);
      }
    },
  });

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" }).catch(() => {});
    setAuthenticated(false);
  };

  const filteredOrders = useMemo(() => {
    const q = normalizeText(search);
    if (!q) return orders;
    return orders.filter((order) => {
      const haystack = normalizeText(
        `${order.id} ${order.customer_name} ${order.bairro || ""} ${order.items
          .map((it) => it.flavors.map((f) => f.name).join(" "))
          .join(" ")}`
      );
      return haystack.includes(q);
    });
  }, [orders, search]);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "pending" ||
          o.status === "preparing" ||
          o.status === "delivering"
      ),
    [orders]
  );

  const delayedCount = useMemo(
    () => activeOrders.filter((o) => getOrderSla(o, nowMs).isDelayed).length,
    [activeOrders, nowMs]
  );

  const todayStats = useMemo(
    () => computeCashClosingStats(orders, "today"),
    [orders]
  );

  if (!authChecked) {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-4"
      >
        <div className="w-full space-y-3 border border-border bg-card p-6 animate-skeleton">
          <div className="h-4 w-32 bg-secondary" />
          <div className="h-8 w-56 bg-secondary" />
          <div className="h-11 w-full bg-secondary" />
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-dvh bg-background">
      <AdminHeader
        activeOrdersCount={activeOrders.length}
        isStoreOpen={isStoreOpen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        usbDevice={usbDevice}
        autoPrint={autoPrint}
        onToggleAutoPrint={() => setAutoPrint((a) => !a)}
        onConnectUsb={connectUsbPrinter}
        onOpenSummary={() => setSummaryOpen(true)}
        onOpenClosing={() => setClosingOpen(true)}
        onOpenStock={() => setStockOpen(true)}
        onOpenStoreStatus={() => setStoreModalOpen(true)}
        onRefresh={refresh}
        onLogout={handleLogout}
      />

      <main
        id="main-content"
        className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6"
      >
        <section
          aria-label="Resumo operacional do turno"
          className="grid grid-cols-2 gap-4 border-b border-border pb-4 sm:grid-cols-4"
        >
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Na fila agora
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground tabular-nums">
              {activeOrders.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Atrasados (&ge;35 min)
            </p>
            <p
              className={`mt-0.5 font-mono text-2xl font-semibold tabular-nums ${
                delayedCount > 0
                  ? "text-foreground underline"
                  : "text-muted-foreground"
              }`}
            >
              {delayedCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Faturamento hoje
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground tabular-nums">
              R$ {formatPrice(todayStats.totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Ticket médio hoje
            </p>
            <p className="mt-0.5 font-mono text-2xl font-semibold text-foreground tabular-nums">
              R$ {formatPrice(todayStats.averageTicket)}
            </p>
          </div>
        </section>

        {(error || printerError) && (
          <div
            role="alert"
            className="border border-foreground bg-secondary px-4 py-3 text-xs font-semibold text-foreground"
          >
            {error || printerError}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div
            className="grid gap-5 lg:grid-cols-3"
            aria-label="Carregando fila de pedidos"
          >
            {[0, 1, 2].map((col) => (
              <div
                key={col}
                className="space-y-3 border border-border bg-secondary/40 p-4 animate-skeleton"
              >
                <div className="h-6 w-36 bg-card" />
                <div className="h-44 w-full bg-card" />
                <div className="h-36 w-full bg-card" />
              </div>
            ))}
          </div>
        ) : (
          <OrderBoard
            orders={filteredOrders}
            viewMode={viewMode}
            filter={filter}
            onFilterChange={setFilter}
            nowMs={nowMs}
            onUpdateStatus={(id, status) => updateOrderStatus(id, status)}
            onRequestCancel={(order) => setOrderToCancel(order)}
            onPrint={printOrder}
          />
        )}
      </main>

      <OvenSummaryModal
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        orders={orders}
      />

      <CashClosingModal
        open={closingOpen}
        onOpenChange={setClosingOpen}
        orders={orders}
        onPrintClosing={printClosingReport}
      />

      <StockModal
        open={stockOpen}
        onOpenChange={setStockOpen}
        isPaused={isPaused}
        onToggleStock={toggleStock}
      />

      <StoreStatusModal
        open={storeModalOpen}
        onOpenChange={setStoreModalOpen}
        currentMode={storeMode}
        currentMessage={customMessage}
        isAutoOpen={isAutoOpen}
        onSave={(mode, msg) => updateStoreStatus(mode, msg)}
      />

      <CancelOrderModal
        order={orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirmCancel={async (id, reason) => {
          await updateOrderStatus(id, "cancelled", reason);
        }}
      />
    </div>
  );
}
