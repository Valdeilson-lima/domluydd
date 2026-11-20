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
import type { OrderFilter, ViewMode } from "@/features/admin/types";
import { normalizeText } from "@/lib/utils";
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

  const activeOrdersCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "pending" ||
          o.status === "preparing" ||
          o.status === "delivering"
      ).length,
    [orders]
  );

  if (!authChecked) {
    return (
      <main
        id="conteudo-principal"
        className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 text-sm text-muted-foreground"
      >
        Verificando sessão administrativa…
      </main>
    );
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader
        activeOrdersCount={activeOrdersCount}
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
        id="conteudo-principal"
        className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6"
      >
        {(error || printerError) && (
          <div
            role="alert"
            className="border border-foreground bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground"
          >
            {error || printerError}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Carregando fila da cozinha…
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
