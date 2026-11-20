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
              className="flex h-11 items-center gap-2 font-serif text-xl text-foreground"
            >
              <span
                className="inline-block h-4 w-4 rounded-full border-[3px] border-foreground shadow-[0_0_0_2px_var(--background)]"
                aria-hidden="true"
              />
              {STORE_SHORT_NAME} · KDS
            </Link>
            <span className="border border-border bg-secondary px-2.5 py-0.5 font-mono text-xs font-semibold text-foreground">
              {activeOrdersCount} ativos
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenStoreStatus}
              className={`inline-flex h-11 items-center gap-1.5 border px-3 text-xs font-semibold ${
                isStoreOpen
                  ? "border-foreground bg-secondary text-foreground"
                  : "border-foreground bg-primary text-primary-foreground"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <Store className="h-3.5 w-3.5" />
              {isStoreOpen ? "Loja Aberta" : "Loja Fechada"}
            </button>

            <button
              type="button"
              onClick={onOpenSummary}
              className="inline-flex h-11 items-center gap-1.5 border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              <Flame className="h-3.5 w-3.5" />
              Forno
            </button>

            <button
              type="button"
              onClick={onOpenStock}
              className="inline-flex h-11 items-center gap-1.5 border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              <PackageCheck className="h-3.5 w-3.5" />
              Estoque
            </button>

            <button
              type="button"
              onClick={onOpenClosing}
              className="inline-flex h-11 items-center gap-1.5 border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Caixa
            </button>

            <button
              type="button"
              onClick={onConnectUsb}
              className={`inline-flex h-11 items-center gap-1.5 border px-3 text-xs font-semibold ${
                usbDevice
                  ? "border-foreground bg-secondary text-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <Printer className="h-3.5 w-3.5" />
              {usbDevice ? "USB OK" : "USB"}
            </button>

            <button
              type="button"
              onClick={onToggleAutoPrint}
              aria-pressed={autoPrint}
              className={`inline-flex h-11 items-center border px-2.5 text-xs font-semibold ${
                autoPrint
                  ? "border-foreground bg-secondary text-foreground"
                  : "border-border bg-card text-muted-foreground"
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
              className="inline-flex h-11 w-11 items-center justify-center border border-border bg-card text-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <button
              type="button"
              onClick={onRefresh}
              aria-label="Atualizar pedidos"
              className="inline-flex h-11 w-11 items-center justify-center border border-border bg-card text-foreground hover:bg-secondary"
              style={{ borderRadius: "2px" }}
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair do painel"
              className="inline-flex h-11 items-center gap-1 border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              style={{ borderRadius: "2px" }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-55 max-w-sm">
            <label htmlFor="admin-order-search" className="sr-only">
              Buscar pedido por nome, ID ou sabor
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="admin-order-search"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ex.: Maria, #1234 ou marguerita…"
              className="h-11 w-full border border-input bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              style={{ borderRadius: "2px" }}
            />
          </div>

          <div className="flex items-center gap-1 border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("kanban")}
              className={`inline-flex h-11 items-center gap-1.5 px-3 text-xs font-semibold ${
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`inline-flex h-11 items-center gap-1.5 px-3 text-xs font-semibold ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ borderRadius: "2px" }}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grade
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
