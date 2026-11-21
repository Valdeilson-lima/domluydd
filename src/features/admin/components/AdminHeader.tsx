"use client";

import Link from "next/link";
import {
  Flame,
  LayoutGrid,
  Columns3,
  Printer,
  Volume2,
  VolumeX,
  RefreshCw,
  LogOut,
  DollarSign,
  PackageCheck,
  Store,
  Search,
} from "lucide-react";
import type { ViewMode } from "@/features/admin/types";
import type { USBDevice } from "@/lib/escpos";
import { STORE_SHORT_NAME } from "@/lib/store-config";

interface AdminHeaderProps {
  activeOrdersCount: number;
  isStoreOpen: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  usbDevice: USBDevice | null;
  autoPrint: boolean;
  onToggleAutoPrint: () => void;
  onConnectUsb: () => void;
  onOpenSummary: () => void;
  onOpenClosing: () => void;
  onOpenStock: () => void;
  onOpenStoreStatus: () => void;
  onRefresh: () => void;
  onLogout: () => void;
}

export function AdminHeader({
  activeOrdersCount,
  isStoreOpen,
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  soundEnabled,
  onToggleSound,
  usbDevice,
  autoPrint,
  onToggleAutoPrint,
  onConnectUsb,
  onOpenSummary,
  onOpenClosing,
  onOpenStock,
  onOpenStoreStatus,
  onRefresh,
  onLogout,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/cardapio"
              translate="no"
              className="flex items-center gap-2 font-serif text-xl text-foreground"
            >
              <span
                className="inline-block size-3.5 rounded-full border-2 border-foreground"
                aria-hidden="true"
              />
              {STORE_SHORT_NAME} · KDS
            </Link>
            <span className="border border-border bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-foreground tabular-nums">
              {activeOrdersCount} ativos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenStoreStatus}
              className={`inline-flex min-h-10 items-center gap-1.5 border px-3 text-xs font-semibold transition-colors ${
                isStoreOpen
                  ? "border-status-open bg-card text-status-open hover:bg-secondary"
                  : "border-foreground bg-primary text-primary-foreground"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <Store className="size-3.5" aria-hidden="true" />
              {isStoreOpen ? "Loja aberta" : "Loja fechada"}
            </button>

            <button
              type="button"
              onClick={onOpenSummary}
              className="inline-flex min-h-10 items-center gap-1.5 border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              <Flame className="size-3.5" aria-hidden="true" />
              Forno
            </button>

            <button
              type="button"
              onClick={onOpenStock}
              className="inline-flex min-h-10 items-center gap-1.5 border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              <PackageCheck className="size-3.5" aria-hidden="true" />
              Estoque
            </button>

            <button
              type="button"
              onClick={onOpenClosing}
              className="inline-flex min-h-10 items-center gap-1.5 border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              <DollarSign className="size-3.5" aria-hidden="true" />
              Caixa
            </button>

            <button
              type="button"
              onClick={onConnectUsb}
              className={`inline-flex min-h-10 items-center gap-1.5 border px-3 text-xs font-semibold transition-colors ${
                usbDevice
                  ? "border-status-open bg-secondary text-status-open"
                  : "border-border bg-card text-foreground hover:border-foreground hover:bg-secondary"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <Printer className="size-3.5" aria-hidden="true" />
              {usbDevice ? "USB OK" : "USB"}
            </button>

            <button
              type="button"
              onClick={onToggleAutoPrint}
              aria-pressed={autoPrint}
              className={`inline-flex min-h-10 items-center border px-3 text-xs font-semibold transition-colors ${
                autoPrint
                  ? "border-foreground bg-secondary text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
              style={{ borderRadius: "2px" }}
              title="Auto-imprimir novos pedidos"
            >
              Auto-imp {autoPrint ? "ON" : "OFF"}
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Silenciar alertas" : "Ativar alertas"}
              aria-pressed={soundEnabled}
              className="inline-flex size-10 items-center justify-center border border-border bg-card text-foreground transition-colors hover:border-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              {soundEnabled ? (
                <Volume2 className="size-4" aria-hidden="true" />
              ) : (
                <VolumeX
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              onClick={onRefresh}
              aria-label="Atualizar pedidos"
              className="inline-flex size-10 items-center justify-center border border-border bg-card text-foreground transition-colors hover:border-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
            </button>

            <span
              className="hidden h-5 w-px bg-border sm:inline-block"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair do painel administrativo"
              className="inline-flex min-h-10 items-center gap-1.5 border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              style={{ borderRadius: "2px" }}
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <label htmlFor="admin-order-search" className="sr-only">
              Buscar pedido por cliente, código ou sabor
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="admin-order-search"
              name="q"
              type="search"
              autoComplete="off"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar cliente, #ID ou sabor…"
              className="min-h-10 w-full border border-input bg-card pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground sm:text-xs"
              style={{ borderRadius: "2px" }}
            />
          </div>

          <div
            className="flex items-center gap-1 border border-border bg-card p-0.5"
            role="group"
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              aria-pressed={viewMode === "kanban"}
              onClick={() => onViewModeChange("kanban")}
              className={`inline-flex min-h-9 items-center gap-1.5 px-3 text-xs font-semibold transition-colors ${
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <Columns3 className="size-3.5" aria-hidden="true" />
              Kanban
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "grid"}
              onClick={() => onViewModeChange("grid")}
              className={`inline-flex min-h-9 items-center gap-1.5 px-3 text-xs font-semibold transition-colors ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              Grade
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
