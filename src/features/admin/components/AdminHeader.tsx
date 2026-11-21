"use client";

import Link from "next/link";
import {
  Flame,
  LayoutGrid,
  Columns3,
  Volume2,
  VolumeX,
  RefreshCw,
  LogOut,
  DollarSign,
  PackageCheck,
  Search,
  UtensilsCrossed,
  ClipboardList,
  Settings,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import type { ViewMode } from "@/features/admin/types";
import type { AdminRole } from "@/types/store";

export type AdminSection = "orders" | "catalog" | "settings";

interface AdminHeaderProps {
  section: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  userRole: AdminRole;
  userName: string;
  activeOrdersCount: number;
  catalogCount: number;
  isStoreOpen: boolean;
  usbConnected: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSummary: () => void;
  onOpenClosing: () => void;
  onOpenStock: () => void;
  onRefresh: () => void;
  onLogout: () => void;
}

export function AdminHeader({
  section,
  onSectionChange,
  userRole,
  userName,
  activeOrdersCount,
  catalogCount,
  isStoreOpen,
  usbConnected,
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  soundEnabled,
  onToggleSound,
  onOpenSummary,
  onOpenClosing,
  onOpenStock,
  onRefresh,
  onLogout,
}: AdminHeaderProps) {
  const isOwner = userRole === "owner";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/cardapio" className="group">
              <BrandMark
                subtitle={isOwner ? "Admin · Dono" : "KDS · Cozinha"}
                size="sm"
              />
            </Link>

            <div
              role="tablist"
              aria-label="Áreas do painel"
              className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={section === "orders"}
                onClick={() => onSectionChange("orders")}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                  section === "orders"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ClipboardList className="size-3.5" aria-hidden="true" />
                Pedidos
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[11px] tabular-nums ${
                    section === "orders"
                      ? "bg-white/20 text-white"
                      : "bg-accent-gold-soft text-accent-gold-ink"
                  }`}
                >
                  {activeOrdersCount}
                </span>
              </button>

              {isOwner && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={section === "catalog"}
                  onClick={() => onSectionChange("catalog")}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                    section === "catalog"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UtensilsCrossed className="size-3.5" aria-hidden="true" />
                  Produtos
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[11px] tabular-nums ${
                      section === "catalog"
                        ? "bg-white/20 text-white"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {catalogCount}
                  </span>
                </button>
              )}

              <button
                type="button"
                role="tab"
                aria-selected={section === "settings"}
                onClick={() => onSectionChange("settings")}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                  section === "settings"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Settings className="size-3.5" aria-hidden="true" />
                {isOwner ? "Configurações" : "Impressora"}
                {usbConnected && (
                  <span
                    title="Impressora USB conectada"
                    className={`size-2 rounded-full ${
                      section === "settings" ? "bg-white" : "bg-status-open"
                    }`}
                    aria-label="Impressora USB conectada"
                  />
                )}
              </button>
            </div>

            <span
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${
                isStoreOpen
                  ? "bg-status-open/10 text-status-open"
                  : "bg-primary/10 text-primary"
              }`}
              title="Altere o funcionamento em Configurações → Loja & Contato"
            >
              <span
                className={`size-1.5 rounded-full ${
                  isStoreOpen ? "bg-status-open" : "bg-primary"
                }`}
                aria-hidden="true"
              />
              {isStoreOpen ? "Aberta" : "Fechada"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenSummary}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
            >
              <Flame className="size-3.5 text-primary" aria-hidden="true" />
              Forno
            </button>

            <button
              type="button"
              onClick={onOpenStock}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
            >
              <PackageCheck className="size-3.5" aria-hidden="true" />
              Estoque
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={onOpenClosing}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
              >
                <DollarSign className="size-3.5" aria-hidden="true" />
                Caixa
              </button>
            )}

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Silenciar alertas" : "Ativar alertas"}
              aria-pressed={soundEnabled}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
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
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
            </button>

            <span
              className="hidden h-5 w-px bg-border sm:inline-block"
              aria-hidden="true"
            />

            <span
              title={userName}
              className="hidden max-w-[130px] truncate rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-foreground xl:inline-block"
            >
              {userName}
            </span>

            <button
              type="button"
              onClick={onLogout}
              aria-label="Sair do painel administrativo"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>

        {section === "orders" && (
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
                className="min-h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground sm:text-xs"
              />
            </div>

            <div
              className="flex items-center gap-1 rounded-xl border border-border bg-card p-1"
              role="group"
              aria-label="Modo de visualização"
            >
              <button
                type="button"
                aria-pressed={viewMode === "kanban"}
                onClick={() => onViewModeChange("kanban")}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                  viewMode === "kanban"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Columns3 className="size-3.5" aria-hidden="true" />
                Kanban
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "grid"}
                onClick={() => onViewModeChange("grid")}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="size-3.5" aria-hidden="true" />
                Grade
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
