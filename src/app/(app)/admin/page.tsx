"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { useStock } from "@/hooks/useStock";
import { useCatalog } from "@/hooks/useCatalog";
import { useAdminOrders } from "@/features/admin/hooks/useAdminOrders";
import { useAdminPrinter } from "@/features/admin/hooks/useAdminPrinter";
import {
  AdminLogin,
  type AuthenticatedAdminUser,
} from "@/features/admin/components/AdminLogin";
import {
  AdminHeader,
  type AdminSection,
} from "@/features/admin/components/AdminHeader";
import { CatalogManager } from "@/features/admin/components/CatalogManager";
import { StoreSettingsManager } from "@/features/admin/components/StoreSettingsManager";
import { OrderBoard } from "@/features/admin/components/OrderBoard";
import { OvenSummaryModal } from "@/features/admin/components/OvenSummaryModal";
import { CashClosingModal } from "@/features/admin/components/CashClosingModal";
import { StockModal } from "@/features/admin/components/StockModal";
import { CancelOrderModal } from "@/features/admin/components/CancelOrderModal";
import { computeCashClosingStats, getOrderSla } from "@/features/admin/utils";
import type { OrderFilter, ViewMode } from "@/features/admin/types";
import { formatPrice, normalizeText } from "@/lib/utils";
import type { DbOrder } from "@/types/supabase";

export default function AdminKdsPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthenticatedAdminUser | null>(
    null
  );
  const [authMeta, setAuthMeta] = useState<{
    needsSetup: boolean;
    tableReady: boolean;
    setupError: string | null;
  }>({
    needsSetup: false,
    tableReady: true,
    setupError: null,
  });

  const [section, setSection] = useState<AdminSection>("orders");

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [filter, setFilter] = useState<OrderFilter>("active");
  const [search, setSearch] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<DbOrder | null>(null);

  const { catalog, setCatalog, refresh: refreshCatalog } = useCatalog();

  const {
    isOpen: isStoreOpen,
    mode: storeMode,
    customMessage,
    isAutoOpen,
    hoursShort,
    profile: storeProfile,
    refresh: refreshStoreStatus,
    updateStatus: updateStoreStatus,
    updateProfile: updateStoreProfile,
  } = useStoreStatus();
  const { isPaused, toggleStock } = useStock();
  const printerHeader = useMemo(
    () => ({
      storeName: storeProfile.storeName,
      ovenLabel: storeProfile.ovenLabel,
      whatsappDisplay: storeProfile.whatsappDisplay,
    }),
    [
      storeProfile.storeName,
      storeProfile.ovenLabel,
      storeProfile.whatsappDisplay,
    ]
  );

  const {
    usbDevice,
    webUsbSupported,
    autoPrint,
    setAutoPrint,
    printerError,
    connectUsbPrinter,
    disconnectUsbPrinter,
    printOrder,
    printTestOrder,
    printClosingReport,
  } = useAdminPrinter(printerHeader);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      setCurrentUser(
        data?.authenticated && data?.user
          ? (data.user as AuthenticatedAdminUser)
          : null
      );
      setAuthMeta({
        needsSetup: Boolean(data?.needsSetup),
        tableReady: data?.tableReady !== false,
        setupError:
          typeof data?.setupError === "string" ? data.setupError : null,
      });
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const ticker = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(ticker);
  }, []);

  const authenticated = Boolean(currentUser);
  const isOwner = currentUser?.role === "owner";

  useEffect(() => {
    if (!isOwner && section === "catalog") {
      setSection("orders");
    }
  }, [isOwner, section]);

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
    onUnauthorized: () => setCurrentUser(null),
    onNewOrder: (incoming) => {
      if (autoPrint) {
        printOrder(incoming);
      }
    },
  });

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" }).catch(() => {});
    setCurrentUser(null);
    setSection("orders");
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
        <div className="w-full space-y-3 rounded-2xl border border-border bg-card p-6 animate-skeleton">
          <div className="h-4 w-32 rounded bg-secondary" />
          <div className="h-8 w-56 rounded bg-secondary" />
          <div className="h-11 w-full rounded bg-secondary" />
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <AdminLogin
        needsSetup={authMeta.needsSetup}
        tableReady={authMeta.tableReady}
        setupError={authMeta.setupError}
        onRetryCheck={checkAuth}
        onSuccess={(user) => {
          setCurrentUser(user);
          setAuthMeta((prev) => ({ ...prev, needsSetup: false }));
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <AdminHeader
        section={section}
        onSectionChange={setSection}
        userRole={currentUser.role}
        userName={currentUser.fullName || currentUser.email}
        activeOrdersCount={activeOrders.length}
        catalogCount={
          catalog.pizzas.length + catalog.drinks.length + catalog.combos.length
        }
        isStoreOpen={isStoreOpen}
        usbConnected={Boolean(usbDevice)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onOpenSummary={() => setSummaryOpen(true)}
        onOpenClosing={() => setClosingOpen(true)}
        onOpenStock={() => setStockOpen(true)}
        onRefresh={() => {
          refresh();
          refreshCatalog();
          refreshStoreStatus();
        }}
        onLogout={handleLogout}
      />

      <main
        id="main-content"
        className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6"
      >
        {section === "catalog" && isOwner ? (
          <CatalogManager
            catalog={catalog}
            onCatalogChange={setCatalog}
            onUnauthorized={() => setCurrentUser(null)}
          />
        ) : section === "settings" ? (
          <StoreSettingsManager
            userRole={currentUser.role}
            profile={storeProfile}
            isStoreOpen={isStoreOpen}
            storeMode={storeMode}
            customMessage={customMessage}
            isAutoOpen={isAutoOpen}
            hoursShort={hoursShort}
            currentUserId={currentUser.userId}
            usbDevice={usbDevice}
            webUsbSupported={webUsbSupported}
            autoPrint={autoPrint}
            printerError={printerError}
            onToggleAutoPrint={() => setAutoPrint((a) => !a)}
            onConnectUsb={connectUsbPrinter}
            onDisconnectUsb={disconnectUsbPrinter}
            onPrintTest={printTestOrder}
            onSaveStoreStatus={updateStoreStatus}
            onSaveProfile={updateStoreProfile}
            onUnauthorized={() => setCurrentUser(null)}
          />
        ) : (
          <>
            <section
              aria-label="Resumo operacional do turno"
              className={`grid grid-cols-2 gap-3 sm:gap-4 ${
                isOwner ? "sm:grid-cols-4" : "sm:grid-cols-2"
              }`}
            >
              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
                <p className="text-xs font-semibold text-muted-foreground">
                  Na fila agora
                </p>
                <p className="mt-1 font-mono text-2xl font-extrabold text-foreground tabular-nums">
                  {activeOrders.length}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
                <p className="text-xs font-semibold text-muted-foreground">
                  Atrasados (&ge;35 min)
                </p>
                <p
                  className={`mt-1 font-mono text-2xl font-extrabold tabular-nums ${
                    delayedCount > 0 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {delayedCount}
                </p>
              </div>
              {isOwner && (
                <>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Faturamento hoje
                    </p>
                    <p className="mt-1 font-mono text-2xl font-extrabold text-foreground tabular-nums">
                      R$ {formatPrice(todayStats.totalRevenue)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Ticket médio hoje
                    </p>
                    <p className="mt-1 font-mono text-2xl font-extrabold text-foreground tabular-nums">
                      R$ {formatPrice(todayStats.averageTicket)}
                    </p>
                  </div>
                </>
              )}
            </section>

            {(error || printerError) && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive"
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
                    className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-4 animate-skeleton"
                  >
                    <div className="h-6 w-36 rounded bg-card" />
                    <div className="h-44 w-full rounded-xl bg-card" />
                    <div className="h-36 w-full rounded-xl bg-card" />
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
          </>
        )}
      </main>

      <OvenSummaryModal
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        orders={orders}
      />

      {isOwner && (
        <CashClosingModal
          open={closingOpen}
          onOpenChange={setClosingOpen}
          orders={orders}
          onPrintClosing={printClosingReport}
        />
      )}

      <StockModal
        open={stockOpen}
        onOpenChange={setStockOpen}
        catalog={catalog}
        isPaused={isPaused}
        onToggleStock={async (name, available) => {
          const updatedCatalog = await toggleStock(name, available);
          if (updatedCatalog) setCatalog(updatedCatalog);
        }}
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
