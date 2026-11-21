"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Database,
  CheckCircle2,
  AlertCircle,
  Pizza as PizzaIcon,
  CupSoda,
  Package,
  SlidersHorizontal,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUrlField } from "@/features/admin/components/ImageUrlField";
import { broadcastCatalogUpdate } from "@/hooks/useCatalog";
import { getPizzaImageSrc, MEDIA_URLS } from "@/lib/media";
import { formatPrice, normalizeText } from "@/lib/utils";
import type {
  CatalogSnapshot,
  Combo,
  ComboPizzaSlot,
  CrustOption,
  DeliveryBairro,
  Drink,
  ExtraIngredient,
  Pizza,
  PizzaCategory,
} from "@/types";

type CatalogTab = "pizzas" | "drinks" | "combos" | "modifiers" | "bairros";

interface CatalogManagerProps {
  catalog: CatalogSnapshot;
  onCatalogChange: (next: CatalogSnapshot) => void;
  onUnauthorized: () => void;
}

const DEFAULT_REFRI_OPTIONS = [
  "Coca-Cola 2L",
  "Guaraná Antarctica 2L",
  "Fanta Laranja 2L",
];

const QUICK_PIZZA_TAGS = [
  "Mais Pedidas",
  "Tradicionais",
  "Especiais",
  "Queijos",
  "Frango",
  "Carne de Sol",
  "Atum",
  "Regionais",
  "Doces",
];

export function CatalogManager({
  catalog,
  onCatalogChange,
  onUnauthorized,
}: CatalogManagerProps) {
  const [tab, setTab] = useState<CatalogTab>("pizzas");
  const [query, setQuery] = useState("");
  const [pizzaCatFilter, setPizzaCatFilter] = useState<"all" | PizzaCategory>(
    "all"
  );
  const [cloudinaryConfigured, setCloudinaryConfigured] = useState(false);

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  // Modais de edição/criação
  const [pizzaDialog, setPizzaDialog] = useState<{
    open: boolean;
    editing: Pizza | null;
  }>({ open: false, editing: null });
  const [drinkDialog, setDrinkDialog] = useState<{
    open: boolean;
    editing: Drink | null;
  }>({ open: false, editing: null });
  const [comboDialog, setComboDialog] = useState<{
    open: boolean;
    editing: Combo | null;
  }>({ open: false, editing: null });
  const [modifierDialog, setModifierDialog] = useState<{
    open: boolean;
    kind: "crust" | "extra";
    editing: CrustOption | ExtraIngredient | null;
  }>({ open: false, kind: "crust", editing: null });
  const [bairroDialog, setBairroDialog] = useState<{
    open: boolean;
    editing: DeliveryBairro | null;
  }>({ open: false, editing: null });

  const [confirmDelete, setConfirmDelete] = useState<{
    resource: "pizza" | "drink" | "combo" | "crust" | "extra" | "bairro";
    id: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/upload", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCloudinaryConfigured(Boolean(data.configured));
      })
      .catch(() => {});
  }, []);

  const callCatalogApi = async (
    payload: Record<string, unknown>,
    successMsg: string
  ) => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        onUnauthorized();
        return false;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.catalog) {
        setFeedback({
          type: "error",
          text: data?.error || "Não foi possível salvar no catálogo.",
        });
        return false;
      }
      const next = data.catalog as CatalogSnapshot;
      onCatalogChange(next);
      broadcastCatalogUpdate(next);
      setFeedback({ type: "ok", text: successMsg });
      return true;
    } catch {
      setFeedback({
        type: "error",
        text: "Erro de conexão ao salvar alterações.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const filteredPizzas = useMemo(() => {
    const q = normalizeText(query);
    return catalog.pizzas.filter((p) => {
      if (pizzaCatFilter !== "all" && p.category !== pizzaCatFilter) {
        return false;
      }
      if (!q) return true;
      return normalizeText(`${p.name} ${p.desc} ${p.tags.join(" ")}`).includes(
        q
      );
    });
  }, [catalog.pizzas, pizzaCatFilter, query]);

  const filteredDrinks = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return catalog.drinks;
    return catalog.drinks.filter((d) =>
      normalizeText(`${d.name} ${d.desc}`).includes(q)
    );
  }, [catalog.drinks, query]);

  const filteredCombos = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return catalog.combos;
    return catalog.combos.filter((c) =>
      normalizeText(`${c.name} ${c.desc} ${c.items.join(" ")}`).includes(q)
    );
  }, [catalog.combos, query]);

  const filteredBairros = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return catalog.bairros;
    return catalog.bairros.filter((b) => normalizeText(b.nome).includes(q));
  }, [catalog.bairros, query]);

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    const ok = await callCatalogApi(
      {
        action: "delete",
        resource: confirmDelete.resource,
        id: confirmDelete.id,
      },
      `"${confirmDelete.label}" removido do cardápio.`
    );
    if (ok) setConfirmDelete(null);
  };

  const TABS: Array<{
    id: CatalogTab;
    label: string;
    count: number;
    icon: typeof PizzaIcon;
  }> = [
    {
      id: "pizzas",
      label: "Pizzas",
      count: catalog.pizzas.length,
      icon: PizzaIcon,
    },
    {
      id: "drinks",
      label: "Bebidas",
      count: catalog.drinks.length,
      icon: CupSoda,
    },
    {
      id: "combos",
      label: "Combos",
      count: catalog.combos.length,
      icon: Package,
    },
    {
      id: "modifiers",
      label: "Bordas & Adicionais",
      count: catalog.crusts.length + catalog.extras.length,
      icon: SlidersHorizontal,
    },
    {
      id: "bairros",
      label: "Bairros & Fretes",
      count: catalog.bairros.length,
      icon: MapPin,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status da persistência */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xs sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${
              catalog.supabaseConnected && catalog.hasServiceRoleKey
                ? "bg-status-open/10 text-status-open"
                : "bg-accent-gold-soft text-accent-gold-ink"
            }`}
          >
            <Database className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-0.5">
            <h1 className="font-serif text-xl font-extrabold text-foreground">
              Gestão de Produtos & Cardápio
            </h1>
            <p className="text-xs text-muted-foreground">
              {catalog.supabaseConnected && !catalog.hasServiceRoleKey
                ? "Falta adicionar SUPABASE_SERVICE_ROLE_KEY (chave Secret / service_role do Supabase) no .env.local e reiniciar o servidor para gravar alterações no banco."
                : catalog.supabaseConnected
                  ? "Conectado ao Supabase: toda edição atualiza o cardápio público em tempo real e a validação de preços no servidor. As imagens salvam apenas a URL (Cloudinary)."
                  : "Supabase indisponível. Verifique NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e se supabase/schema.sql foi executado."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              cloudinaryConfigured
                ? "bg-status-open/10 text-status-open"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {cloudinaryConfigured ? "Cloudinary: Ativo" : "Cloudinary: Via URL"}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold ${
            feedback.type === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-status-open/30 bg-status-open/10 text-status-open"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Abas de recurso */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Seções do catálogo"
          className="no-scrollbar flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(t.id);
                  setQuery("");
                }}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{t.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[11px] tabular-nums ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Botão primário contextual */}
        {tab === "pizzas" && (
          <button
            type="button"
            onClick={() => setPizzaDialog({ open: true, editing: null })}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova pizza
          </button>
        )}
        {tab === "drinks" && (
          <button
            type="button"
            onClick={() => setDrinkDialog({ open: true, editing: null })}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova bebida
          </button>
        )}
        {tab === "combos" && (
          <button
            type="button"
            onClick={() => setComboDialog({ open: true, editing: null })}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo combo
          </button>
        )}
        {tab === "bairros" && (
          <button
            type="button"
            onClick={() => setBairroDialog({ open: true, editing: null })}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo bairro
          </button>
        )}
      </div>

      {/* Busca para listas */}
      {tab !== "modifiers" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar por nome ou ingrediente…"
              className="min-h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm text-foreground"
            />
          </div>

          {tab === "pizzas" && (
            <div className="flex gap-1.5">
              {(
                [
                  { id: "all", label: "Todas" },
                  { id: "salgada", label: "Salgadas" },
                  { id: "doce", label: "Doces" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPizzaCatFilter(opt.id)}
                  className={`min-h-10 rounded-full border px-3.5 text-xs font-bold transition-colors ${
                    pizzaCatFilter === opt.id
                      ? "border-primary/40 bg-accent-gold-soft text-accent-gold-ink"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB PIZZAS ==================== */}
      {tab === "pizzas" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPizzas.map((pizza) => (
            <article
              key={pizza.id}
              className={`flex flex-col justify-between gap-3 rounded-2xl border bg-card p-3.5 shadow-2xs ${
                pizza.available === false
                  ? "border-border opacity-65"
                  : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={getPizzaImageSrc(pizza.imgIdx, pizza.image)}
                  alt={pizza.name}
                  className="size-18 shrink-0 rounded-xl object-cover bg-secondary"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="truncate font-serif text-base font-bold text-foreground">
                      {pizza.name}
                    </h2>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                      {pizza.category}
                    </span>
                    {pizza.highlight && (
                      <span className="rounded-full bg-accent-gold-soft px-2 py-0.5 text-[10px] font-bold text-accent-gold-ink">
                        Destaque
                      </span>
                    )}
                    {pizza.available === false && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                        Pausada
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {pizza.desc}
                  </p>
                  <p className="text-xs font-extrabold text-foreground tabular-nums">
                    P R$ {formatPrice(pizza.p)} · M R$ {formatPrice(pizza.m)} ·
                    G R$ {formatPrice(pizza.g)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    callCatalogApi(
                      {
                        action: "upsert",
                        resource: "pizza",
                        data: {
                          ...pizza,
                          available: pizza.available === false,
                        },
                      },
                      pizza.available === false
                        ? `${pizza.name} reativada.`
                        : `${pizza.name} pausada.`
                    )
                  }
                  className="min-h-9 rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground hover:bg-secondary"
                >
                  {pizza.available === false ? "Ativar" : "Pausar"}
                </button>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setPizzaDialog({ open: true, editing: pizza })
                    }
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground hover:border-primary/40 hover:text-primary"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDelete({
                        resource: "pizza",
                        id: pizza.id,
                        label: pizza.name,
                      })
                    }
                    aria-label={`Excluir ${pizza.name}`}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ==================== TAB BEBIDAS ==================== */}
      {tab === "drinks" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDrinks.map((drink) => (
            <article
              key={drink.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs"
            >
              <div className="flex items-start gap-3">
                {drink.image ? (
                  <img
                    src={drink.image}
                    alt={drink.name}
                    className="size-14 shrink-0 rounded-xl object-cover bg-secondary"
                  />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <CupSoda className="size-5" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-base font-bold text-foreground">
                      {drink.name}
                    </h2>
                    {drink.available === false && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                        Pausada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{drink.desc}</p>
                  <p className="pt-0.5 text-sm font-extrabold text-primary tabular-nums">
                    R$ {formatPrice(drink.price)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-border pt-2.5">
                <button
                  type="button"
                  onClick={() => setDrinkDialog({ open: true, editing: drink })}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground hover:border-primary/40 hover:text-primary"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDelete({
                      resource: "drink",
                      id: drink.id,
                      label: drink.name,
                    })
                  }
                  aria-label={`Excluir ${drink.name}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ==================== TAB COMBOS ==================== */}
      {tab === "combos" && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCombos.map((combo) => (
            <article
              key={combo.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={combo.image || MEDIA_URLS.comboPizzaria}
                  alt={combo.name}
                  className="size-20 shrink-0 rounded-xl object-cover bg-secondary"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-lg font-bold text-foreground">
                      {combo.name}
                    </h2>
                    {combo.available === false && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                        Pausado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{combo.desc}</p>
                  <p className="text-sm font-extrabold text-primary tabular-nums">
                    R$ {formatPrice(combo.price)}{" "}
                    <span className="text-xs font-normal text-muted-foreground line-through">
                      R$ {formatPrice(combo.originalPrice)}
                    </span>
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {combo.pizzaSlots.length}{" "}
                    {combo.pizzaSlots.length === 1 ? "pizza" : "pizzas"} ·{" "}
                    {combo.drinkSlots?.length
                      ? `${combo.drinkSlots.length} bebida(s) à escolha`
                      : combo.fixedDrinkLabel || "Sem bebida fixa"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-border pt-2.5">
                <button
                  type="button"
                  onClick={() => setComboDialog({ open: true, editing: combo })}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground hover:border-primary/40 hover:text-primary"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDelete({
                      resource: "combo",
                      id: combo.id,
                      label: combo.name,
                    })
                  }
                  aria-label={`Excluir ${combo.name}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ==================== TAB BORDAS & ADICIONAIS ==================== */}
      {tab === "modifiers" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Bordas recheadas
                </h2>
                <p className="text-xs text-muted-foreground">
                  Opções exibidas ao personalizar cada pizza.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setModifierDialog({
                    open: true,
                    kind: "crust",
                    editing: null,
                  })
                }
                className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary-hover"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Nova borda
              </button>
            </div>

            <ul className="divide-y divide-border">
              {catalog.crusts.map((crust) => (
                <li
                  key={crust.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-foreground">{crust.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {crust.price > 0
                        ? `+R$ ${formatPrice(crust.price)}`
                        : "Grátis"}{" "}
                      · {crust.compatibleWith.join(" e ")}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setModifierDialog({
                          open: true,
                          kind: "crust",
                          editing: crust,
                        })
                      }
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-bold hover:border-primary/40"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDelete({
                          resource: "crust",
                          id: crust.id,
                          label: crust.name,
                        })
                      }
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Adicionais extras
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ingredientes opcionais pagos à parte.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setModifierDialog({
                    open: true,
                    kind: "extra",
                    editing: null,
                  })
                }
                className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary-hover"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Novo adicional
              </button>
            </div>

            <ul className="divide-y divide-border">
              {catalog.extras.map((extra) => (
                <li
                  key={extra.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-foreground">{extra.name}</p>
                    <p className="text-xs text-muted-foreground">
                      +R$ {formatPrice(extra.price)} ·{" "}
                      {extra.compatibleWith.join(" e ")}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setModifierDialog({
                          open: true,
                          kind: "extra",
                          editing: extra,
                        })
                      }
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-bold hover:border-primary/40"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDelete({
                          resource: "extra",
                          id: extra.id,
                          label: extra.name,
                        })
                      }
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {/* ==================== TAB BAIRROS ==================== */}
      {tab === "bairros" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBairros.map((bairro) => (
            <article
              key={bairro.id ?? bairro.nome}
              className={`flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs ${
                bairro.active === false ? "opacity-60" : ""
              }`}
            >
              <div>
                <p className="font-serif text-base font-bold text-foreground">
                  {bairro.nome}
                </p>
                <p className="text-sm font-extrabold text-primary tabular-nums">
                  Taxa: R$ {formatPrice(bairro.frete)}
                </p>
                {bairro.active === false && (
                  <span className="text-[11px] font-bold text-destructive">
                    Entrega pausada
                  </span>
                )}
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setBairroDialog({ open: true, editing: bairro })
                  }
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-bold hover:border-primary/40"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDelete({
                      resource: "bairro",
                      id: bairro.id ?? bairro.nome,
                      label: bairro.nome,
                    })
                  }
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ==================== MODAIS CRUD ==================== */}
      <PizzaFormModal
        open={pizzaDialog.open}
        editing={pizzaDialog.editing}
        busy={busy}
        cloudinaryConfigured={cloudinaryConfigured}
        onClose={() => setPizzaDialog({ open: false, editing: null })}
        onSave={async (data) => {
          const ok = await callCatalogApi(
            { action: "upsert", resource: "pizza", data },
            pizzaDialog.editing
              ? `Pizza "${data.name}" atualizada.`
              : `Pizza "${data.name}" cadastrada!`
          );
          if (ok) setPizzaDialog({ open: false, editing: null });
        }}
      />

      <DrinkFormModal
        open={drinkDialog.open}
        editing={drinkDialog.editing}
        busy={busy}
        cloudinaryConfigured={cloudinaryConfigured}
        onClose={() => setDrinkDialog({ open: false, editing: null })}
        onSave={async (data) => {
          const ok = await callCatalogApi(
            { action: "upsert", resource: "drink", data },
            drinkDialog.editing
              ? `Bebida "${data.name}" atualizada.`
              : `Bebida "${data.name}" cadastrada!`
          );
          if (ok) setDrinkDialog({ open: false, editing: null });
        }}
      />

      <ComboFormModal
        open={comboDialog.open}
        editing={comboDialog.editing}
        busy={busy}
        cloudinaryConfigured={cloudinaryConfigured}
        onClose={() => setComboDialog({ open: false, editing: null })}
        onSave={async (data) => {
          const ok = await callCatalogApi(
            { action: "upsert", resource: "combo", data },
            comboDialog.editing
              ? `Combo "${data.name}" atualizado.`
              : `Combo "${data.name}" cadastrado!`
          );
          if (ok) setComboDialog({ open: false, editing: null });
        }}
      />

      <ModifierFormModal
        open={modifierDialog.open}
        kind={modifierDialog.kind}
        editing={modifierDialog.editing}
        busy={busy}
        onClose={() =>
          setModifierDialog({ open: false, kind: "crust", editing: null })
        }
        onSave={async (data) => {
          const ok = await callCatalogApi(
            { action: "upsert", resource: modifierDialog.kind, data },
            `${modifierDialog.kind === "crust" ? "Borda" : "Adicional"} "${data.name}" salvo!`
          );
          if (ok)
            setModifierDialog({ open: false, kind: "crust", editing: null });
        }}
      />

      <BairroFormModal
        open={bairroDialog.open}
        editing={bairroDialog.editing}
        busy={busy}
        onClose={() => setBairroDialog({ open: false, editing: null })}
        onSave={async (data) => {
          const ok = await callCatalogApi(
            { action: "upsert", resource: "bairro", data },
            `Bairro "${data.nome}" salvo!`
          );
          if (ok) setBairroDialog({ open: false, editing: null });
        }}
      />

      {/* Confirmação de exclusão */}
      <Dialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent className="max-w-md">
          {confirmDelete && (
            <>
              <DialogHeader>
                <DialogTitle>Excluir item do cardápio?</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja remover{" "}
                  <strong>{confirmDelete.label}</strong>? Ele deixará de
                  aparecer para os clientes imediatamente.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="min-h-11 flex-1 rounded-xl border border-border bg-card text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDeleteConfirmed}
                  className="min-h-11 flex-1 rounded-xl bg-destructive text-xs font-bold text-destructive-foreground disabled:opacity-50"
                >
                  {busy ? "Removendo…" : "Sim, excluir"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// SUB-MODAIS DE FORMULÁRIO
// ============================================================================

function PizzaFormModal({
  open,
  editing,
  busy,
  cloudinaryConfigured,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Pizza | null;
  busy: boolean;
  cloudinaryConfigured: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    desc: string;
    category: PizzaCategory;
    p: number;
    m: number;
    g: number;
    image: string;
    tags: string[];
    highlight: boolean;
    available: boolean;
  }) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar: ${editing.name}` : "Cadastrar nova pizza"}
          </DialogTitle>
          <DialogDescription>
            Defina ingredientes, preços P/M/G e foto (Cloudinary ou URL).
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PizzaFormBody
            key={editing?.id ?? "new-pizza"}
            editing={editing}
            busy={busy}
            cloudinaryConfigured={cloudinaryConfigured}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PizzaFormBody({
  editing,
  busy,
  cloudinaryConfigured,
  onSave,
}: {
  editing: Pizza | null;
  busy: boolean;
  cloudinaryConfigured: boolean;
  onSave: (data: {
    id?: string;
    name: string;
    desc: string;
    category: PizzaCategory;
    p: number;
    m: number;
    g: number;
    image: string;
    tags: string[];
    highlight: boolean;
    available: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [desc, setDesc] = useState(editing?.desc ?? "");
  const [category, setCategory] = useState<PizzaCategory>(
    editing?.category ?? "salgada"
  );
  const [p, setP] = useState(String(editing?.p ?? 30));
  const [m, setM] = useState(String(editing?.m ?? 35));
  const [g, setG] = useState(String(editing?.g ?? 40));
  const [image, setImage] = useState(
    editing ? getPizzaImageSrc(editing.imgIdx, editing.image) : ""
  );
  const [tags, setTags] = useState<string[]>(editing?.tags ?? ["Tradicionais"]);
  const [highlight, setHighlight] = useState(Boolean(editing?.highlight));
  const [available, setAvailable] = useState(editing?.available !== false);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: editing?.id,
          name,
          desc,
          category,
          p: Number(p.replace(",", ".")) || 0,
          m: Number(m.replace(",", ".")) || 0,
          g: Number(g.replace(",", ".")) || 0,
          image,
          tags,
          highlight,
          available,
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="pizza-name"
            className="block text-xs font-bold text-foreground"
          >
            Nome do sabor *
          </label>
          <input
            id="pizza-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Camarão com Catupiry"
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="pizza-cat"
            className="block text-xs font-bold text-foreground"
          >
            Categoria
          </label>
          <select
            id="pizza-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as PizzaCategory)}
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            <option value="salgada">Pizza Salgada</option>
            <option value="doce">Pizza Doce</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="pizza-desc"
          className="block text-xs font-bold text-foreground"
        >
          Ingredientes / Descrição
        </label>
        <textarea
          id="pizza-desc"
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Molho de tomate fresco, mussarela, ..."
          className="w-full rounded-xl border border-input bg-card p-3 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="pizza-p"
            className="block text-xs font-bold text-foreground"
          >
            Preço P (4f)
          </label>
          <input
            id="pizza-p"
            type="number"
            step="0.5"
            min="0"
            required
            value={p}
            onChange={(e) => setP(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="pizza-m"
            className="block text-xs font-bold text-foreground"
          >
            Preço M (6f)
          </label>
          <input
            id="pizza-m"
            type="number"
            step="0.5"
            min="0"
            required
            value={m}
            onChange={(e) => setM(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="pizza-g"
            className="block text-xs font-bold text-foreground"
          >
            Preço G (8f)
          </label>
          <input
            id="pizza-g"
            type="number"
            step="0.5"
            min="0"
            required
            value={g}
            onChange={(e) => setG(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          />
        </div>
      </div>

      <ImageUrlField
        id="pizza-image-url"
        value={image}
        onChange={setImage}
        cloudinaryConfigured={cloudinaryConfigured}
      />

      <div className="space-y-1.5">
        <span className="block text-xs font-bold text-foreground">
          Tags / Filtros do cardápio
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PIZZA_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  active
                    ? "border-primary/40 bg-accent-gold-soft text-accent-gold-ink"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-foreground">
          <input
            type="checkbox"
            checked={highlight}
            onChange={(e) => setHighlight(e.target.checked)}
            className="size-4 accent-primary"
          />
          Destaque (&ldquo;Pedida da casa&rdquo;)
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-foreground">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="size-4 accent-primary"
          />
          Disponível para pedidos
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
      >
        {busy ? "Salvando…" : "Salvar pizza"}
      </button>
    </form>
  );
}

function DrinkFormModal({
  open,
  editing,
  busy,
  cloudinaryConfigured,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Drink | null;
  busy: boolean;
  cloudinaryConfigured: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    desc: string;
    price: number;
    icon: string;
    image: string;
    tags: string[];
    available: boolean;
  }) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar: ${editing.name}` : "Cadastrar nova bebida"}
          </DialogTitle>
          <DialogDescription>
            Adicione refrigerantes, sucos ou bebidas regionais com foto opcional
            no Cloudinary.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <DrinkFormBody
            key={editing?.id ?? "new-drink"}
            editing={editing}
            busy={busy}
            cloudinaryConfigured={cloudinaryConfigured}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DrinkFormBody({
  editing,
  busy,
  cloudinaryConfigured,
  onSave,
}: {
  editing: Drink | null;
  busy: boolean;
  cloudinaryConfigured: boolean;
  onSave: (data: {
    id?: string;
    name: string;
    desc: string;
    price: number;
    icon: string;
    image: string;
    tags: string[];
    available: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [desc, setDesc] = useState(editing?.desc ?? "");
  const [price, setPrice] = useState(String(editing?.price ?? 8));
  const [icon, setIcon] = useState(editing?.icon ?? "coca");
  const [image, setImage] = useState(editing?.image ?? "");
  const [available, setAvailable] = useState(editing?.available !== false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: editing?.id,
          name,
          desc,
          price: Number(price.replace(",", ".")) || 0,
          icon,
          image,
          tags: [
            icon === "cajuina"
              ? "Regionais"
              : icon === "fanta"
                ? "Cítricos"
                : "Clássicos",
            "Gelados",
          ],
          available,
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="drink-name"
            className="block text-xs font-bold text-foreground"
          >
            Nome da bebida *
          </label>
          <input
            id="drink-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Coca-Cola 2L"
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="drink-price"
            className="block text-xs font-bold text-foreground"
          >
            Preço (R$) *
          </label>
          <input
            id="drink-price"
            type="number"
            step="0.5"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="drink-desc"
            className="block text-xs font-bold text-foreground"
          >
            Descrição / Volume
          </label>
          <input
            id="drink-desc"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Ex.: Garrafa 2L bem gelada"
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="drink-icon"
            className="block text-xs font-bold text-foreground"
          >
            Estilo / Cor do selo
          </label>
          <select
            id="drink-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            <option value="coca">Cola (Vermelho)</option>
            <option value="guarana">Guaraná (Verde)</option>
            <option value="fanta">Cítrico / Laranja</option>
            <option value="cajuina">Regional / Suco (Âmbar)</option>
          </select>
        </div>
      </div>

      <ImageUrlField
        id="drink-image-url"
        label="Foto da bebida (opcional — Cloudinary ou URL)"
        value={image}
        onChange={setImage}
        cloudinaryConfigured={cloudinaryConfigured}
        showGallery={false}
      />

      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-foreground">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="size-4 accent-primary"
        />
        Disponível para pedidos
      </label>

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
      >
        {busy ? "Salvando…" : "Salvar bebida"}
      </button>
    </form>
  );
}

function ComboFormModal({
  open,
  editing,
  busy,
  cloudinaryConfigured,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Combo | null;
  busy: boolean;
  cloudinaryConfigured: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    desc: string;
    price: number;
    originalPrice: number;
    image: string;
    items: string[];
    pizzaSlots: ComboPizzaSlot[];
    drinkSlots?: Array<{ label: string; options: string[] }>;
    fixedDrinkLabel?: string;
    available: boolean;
  }) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar: ${editing.name}` : "Cadastrar novo combo"}
          </DialogTitle>
          <DialogDescription>
            Configure preço promocional, foto e quantas pizzas/bebidas o cliente
            pode escolher.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ComboFormBody
            key={editing?.id ?? "new-combo"}
            editing={editing}
            busy={busy}
            cloudinaryConfigured={cloudinaryConfigured}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ComboFormBody({
  editing,
  busy,
  cloudinaryConfigured,
  onSave,
}: {
  editing: Combo | null;
  busy: boolean;
  cloudinaryConfigured: boolean;
  onSave: (data: {
    id?: string;
    name: string;
    desc: string;
    price: number;
    originalPrice: number;
    image: string;
    items: string[];
    pizzaSlots: ComboPizzaSlot[];
    drinkSlots?: Array<{ label: string; options: string[] }>;
    fixedDrinkLabel?: string;
    available: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [desc, setDesc] = useState(editing?.desc ?? "");
  const [price, setPrice] = useState(String(editing?.price ?? 54.9));
  const [originalPrice, setOriginalPrice] = useState(
    String(editing?.originalPrice ?? 60)
  );
  const [image, setImage] = useState(
    editing?.image ?? MEDIA_URLS.comboPizzaria
  );
  const [itemsText, setItemsText] = useState(
    editing?.items?.join("\n") ?? "1 Pizza Grande (8 fatias)\n1 Coca-Cola 2L"
  );
  const [pizzaSlots, setPizzaSlots] = useState<ComboPizzaSlot[]>(
    editing?.pizzaSlots?.length
      ? editing.pizzaSlots
      : [
          {
            label: "Pizza Grande (8 fatias)",
            category: "salgada",
            size: "G",
            allowHalf: true,
          },
        ]
  );
  const [drinkMode, setDrinkMode] = useState<"fixed" | "selectable">(
    editing?.drinkSlots?.length ? "selectable" : "fixed"
  );
  const [fixedDrinkLabel, setFixedDrinkLabel] = useState(
    editing?.fixedDrinkLabel ?? "Coca-Cola 2L"
  );
  const [drinkCount, setDrinkCount] = useState(
    editing?.drinkSlots?.length ?? 1
  );
  const [available, setAvailable] = useState(editing?.available !== false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const items = itemsText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        onSave({
          id: editing?.id,
          name,
          desc,
          price: Number(price.replace(",", ".")) || 0,
          originalPrice: Number(originalPrice.replace(",", ".")) || 0,
          image,
          items,
          pizzaSlots,
          fixedDrinkLabel:
            drinkMode === "fixed" ? fixedDrinkLabel.trim() : undefined,
          drinkSlots:
            drinkMode === "selectable"
              ? Array.from({ length: Math.max(1, drinkCount) }, (_, idx) => ({
                  label: `${idx + 1}º Refrigerante 2L`,
                  options: DEFAULT_REFRI_OPTIONS,
                }))
              : undefined,
          available,
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label
          htmlFor="combo-name"
          className="block text-xs font-bold text-foreground"
        >
          Nome do combo *
        </label>
        <input
          id="combo-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Combo Família Don Luydd"
          className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="combo-desc"
          className="block text-xs font-bold text-foreground"
        >
          Descrição
        </label>
        <input
          id="combo-desc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Resumo do que acompanha o combo"
          className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="combo-price"
            className="block text-xs font-bold text-foreground"
          >
            Preço promocional (R$) *
          </label>
          <input
            id="combo-price"
            type="number"
            step="0.1"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="combo-orig"
            className="block text-xs font-bold text-foreground"
          >
            Preço original &ldquo;De&rdquo; (R$)
          </label>
          <input
            id="combo-orig"
            type="number"
            step="0.1"
            min="0"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          />
        </div>
      </div>

      <ImageUrlField
        id="combo-image-url"
        value={image}
        onChange={setImage}
        cloudinaryConfigured={cloudinaryConfigured}
      />

      <div className="space-y-1">
        <label
          htmlFor="combo-items"
          className="block text-xs font-bold text-foreground"
        >
          Itens exibidos no card (um por linha)
        </label>
        <textarea
          id="combo-items"
          rows={3}
          value={itemsText}
          onChange={(e) => setItemsText(e.target.value)}
          className="w-full rounded-xl border border-input bg-card p-3 text-xs"
        />
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-secondary/40 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Pizzas configuráveis pelo cliente ({pizzaSlots.length})
          </span>
          <button
            type="button"
            onClick={() =>
              setPizzaSlots((prev) => [
                ...prev,
                {
                  label: `${prev.length + 1}ª Pizza Grande (8 fatias)`,
                  category: "salgada",
                  size: "G",
                  allowHalf: true,
                },
              ])
            }
            className="rounded-lg bg-card px-2.5 py-1 text-xs font-bold text-primary border border-border hover:bg-secondary"
          >
            + Adicionar pizza
          </button>
        </div>

        {pizzaSlots.map((slot, idx) => (
          <div
            key={idx}
            className="grid gap-2 rounded-xl border border-border bg-card p-2.5 sm:grid-cols-12 sm:items-center"
          >
            <input
              type="text"
              value={slot.label}
              onChange={(e) =>
                setPizzaSlots((prev) =>
                  prev.map((s, i) =>
                    i === idx ? { ...s, label: e.target.value } : s
                  )
                )
              }
              className="min-h-9 rounded-lg border border-input px-2 text-xs sm:col-span-5"
            />
            <select
              value={slot.category}
              onChange={(e) =>
                setPizzaSlots((prev) =>
                  prev.map((s, i) =>
                    i === idx
                      ? { ...s, category: e.target.value as PizzaCategory }
                      : s
                  )
                )
              }
              className="min-h-9 rounded-lg border border-input px-2 text-xs sm:col-span-3"
            >
              <option value="salgada">Salgada</option>
              <option value="doce">Doce</option>
            </select>
            <select
              value={slot.size}
              onChange={(e) => {
                const sz = e.target.value as "P" | "M" | "G";
                setPizzaSlots((prev) =>
                  prev.map((s, i) =>
                    i === idx ? { ...s, size: sz, allowHalf: sz !== "P" } : s
                  )
                );
              }}
              className="min-h-9 rounded-lg border border-input px-2 text-xs sm:col-span-2"
            >
              <option value="P">P</option>
              <option value="M">M</option>
              <option value="G">G</option>
            </select>
            <div className="flex justify-end sm:col-span-2">
              {pizzaSlots.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setPizzaSlots((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label="Remover slot"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="combo-drink-mode"
            className="block text-xs font-bold text-foreground"
          >
            Bebida do combo
          </label>
          <select
            id="combo-drink-mode"
            value={drinkMode}
            onChange={(e) =>
              setDrinkMode(e.target.value as "fixed" | "selectable")
            }
            className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            <option value="fixed">Bebida fixa</option>
            <option value="selectable">Cliente escolhe refrigerante 2L</option>
          </select>
        </div>

        {drinkMode === "fixed" ? (
          <div className="space-y-1">
            <label
              htmlFor="combo-fixed-drink"
              className="block text-xs font-bold text-foreground"
            >
              Qual bebida fixa?
            </label>
            <input
              id="combo-fixed-drink"
              value={fixedDrinkLabel}
              onChange={(e) => setFixedDrinkLabel(e.target.value)}
              placeholder="Ex.: Coca-Cola 2L"
              className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label
              htmlFor="combo-drink-qty"
              className="block text-xs font-bold text-foreground"
            >
              Quantos refrigerantes 2L?
            </label>
            <input
              id="combo-drink-qty"
              type="number"
              min="1"
              max="4"
              value={drinkCount}
              onChange={(e) => setDrinkCount(Number(e.target.value) || 1)}
              className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            />
          </div>
        )}
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-foreground">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="size-4 accent-primary"
        />
        Combo ativo no cardápio
      </label>

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
      >
        {busy ? "Salvando…" : "Salvar combo"}
      </button>
    </form>
  );
}

function ModifierFormModal({
  open,
  kind,
  editing,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  kind: "crust" | "extra";
  editing: CrustOption | ExtraIngredient | null;
  busy: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    price: number;
    compatibleWith: PizzaCategory[];
    available: boolean;
  }) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing
              ? `Editar ${kind === "crust" ? "borda" : "adicional"}`
              : `Novo ${kind === "crust" ? "tipo de borda" : "adicional"}`}
          </DialogTitle>
          <DialogDescription>
            Informe o nome, valor adicional e para quais pizzas fica disponível.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ModifierFormBody
            key={editing?.id ?? `new-${kind}`}
            editing={editing}
            busy={busy}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ModifierFormBody({
  editing,
  busy,
  onSave,
}: {
  editing: CrustOption | ExtraIngredient | null;
  busy: boolean;
  onSave: (data: {
    id?: string;
    name: string;
    price: number;
    compatibleWith: PizzaCategory[];
    available: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [price, setPrice] = useState(String(editing?.price ?? 8));
  const [salgada, setSalgada] = useState(
    editing ? editing.compatibleWith.includes("salgada") : true
  );
  const [doce, setDoce] = useState(
    editing ? editing.compatibleWith.includes("doce") : false
  );
  const [available, setAvailable] = useState(editing?.available !== false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const compat: PizzaCategory[] = [];
        if (salgada) compat.push("salgada");
        if (doce) compat.push("doce");
        onSave({
          id: editing?.id,
          name,
          price: Number(price.replace(",", ".")) || 0,
          compatibleWith: compat.length > 0 ? compat : ["salgada"],
          available,
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label
          htmlFor="mod-name"
          className="block text-xs font-bold text-foreground"
        >
          Nome *
        </label>
        <input
          id="mod-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Borda de Cream Cheese"
          className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="mod-price"
          className="block text-xs font-bold text-foreground"
        >
          Preço adicional (R$) *
        </label>
        <input
          id="mod-price"
          type="number"
          step="0.5"
          min="0"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={salgada}
            onChange={(e) => setSalgada(e.target.checked)}
            className="size-4 accent-primary"
          />
          Pizzas salgadas
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={doce}
            onChange={(e) => setDoce(e.target.checked)}
            className="size-4 accent-primary"
          />
          Pizzas doces
        </label>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="size-4 accent-primary"
        />
        Disponível
      </label>

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
      >
        {busy ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}

function BairroFormModal({
  open,
  editing,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: DeliveryBairro | null;
  busy: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    nome: string;
    frete: number;
    active: boolean;
  }) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing
              ? `Editar: ${editing.nome}`
              : "Cadastrar bairro de entrega"}
          </DialogTitle>
          <DialogDescription>
            Configure o nome do bairro e o valor do frete calculado no checkout.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <BairroFormBody
            key={editing?.id ?? editing?.nome ?? "new-bairro"}
            editing={editing}
            busy={busy}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BairroFormBody({
  editing,
  busy,
  onSave,
}: {
  editing: DeliveryBairro | null;
  busy: boolean;
  onSave: (data: {
    id?: string;
    nome: string;
    frete: number;
    active: boolean;
  }) => Promise<void>;
}) {
  const [nome, setNome] = useState(editing?.nome ?? "");
  const [frete, setFrete] = useState(String(editing?.frete ?? 7));
  const [active, setActive] = useState(editing?.active !== false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: editing?.id,
          nome,
          frete: Number(frete.replace(",", ".")) || 0,
          active,
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label
          htmlFor="bairro-name"
          className="block text-xs font-bold text-foreground"
        >
          Nome do bairro *
        </label>
        <input
          id="bairro-name"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Bancários"
          className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="bairro-fee"
          className="block text-xs font-bold text-foreground"
        >
          Taxa de entrega (R$) *
        </label>
        <input
          id="bairro-fee"
          type="number"
          step="0.5"
          min="0"
          required
          value={frete}
          onChange={(e) => setFrete(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
        />
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 accent-primary"
        />
        Bairro ativo para entrega
      </label>

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
      >
        {busy ? "Salvando…" : "Salvar bairro"}
      </button>
    </form>
  );
}
