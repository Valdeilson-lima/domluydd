"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  RefreshCw,
  Clock,
  Flame,
  Bike,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { calculateChange } from "@/lib/pricing";
import { updateLastOrderStatus } from "@/lib/order-storage";
import { formatPrice } from "@/lib/utils";
import type { DbOrder, OrderStatus } from "@/types/supabase";

const STEPS: Array<{
  key: OrderStatus;
  title: string;
  desc: string;
  icon: typeof Clock;
}> = [
  {
    key: "pending",
    title: "Pedido recebido",
    desc: "Aguardando confirmação da cozinha.",
    icon: Clock,
  },
  {
    key: "preparing",
    title: "Em preparo no forno elétrico",
    desc: "Massa aberta na hora e assada na pedra.",
    icon: Flame,
  },
  {
    key: "delivering",
    title: "Pronto ou saiu para entrega",
    desc: "A caminho do endereço ou disponível no balcão.",
    icon: Bike,
  },
  {
    key: "completed",
    title: "Pedido entregue",
    desc: "Atendimento finalizado. Bom apetite!",
    icon: CheckCircle2,
  },
];

export default function PedidoTrackingPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";
  const { profile } = useStoreStatus();

  const [order, setOrder] = useState<DbOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [elapsedMin, setElapsedMin] = useState<number | null>(null);

  const fetchOrder = useCallback(
    async (manual = false) => {
      if (!orderId) return;
      if (manual) setRefreshing(true);
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.error || "Pedido não encontrado.");
          return;
        }
        const data = (await res.json()) as DbOrder;
        setOrder(data);
        setError(null);
        updateLastOrderStatus(data.id, data.status);
      } catch {
        setError("Não foi possível consultar o pedido agora.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    fetchOrder(false);
    const interval = window.setInterval(() => {
      fetchOrder(false);
    }, 8000);
    return () => {
      window.clearInterval(interval);
    };
  }, [fetchOrder]);

  useEffect(() => {
    if (!order?.created_at) return;
    const calc = () => {
      const diff = Math.max(
        0,
        Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
      );
      setElapsedMin(diff);
    };
    calc();
    const timer = window.setInterval(calc, 30000);
    return () => window.clearInterval(timer);
  }, [order?.created_at]);

  const handleCopyId = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.id.slice(0, 8).toUpperCase());
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const currentStepIndex = order
    ? STEPS.findIndex((s) => s.key === order.status)
    : -1;

  const troco =
    order && order.payment_method.toLowerCase().includes("dinheiro")
      ? calculateChange(order.total, order.change_for)
      : null;

  const whatsappText = order
    ? encodeURIComponent(
        `Olá ${profile.storeName}! Gostaria de acompanhar meu pedido #${order.id.slice(0, 8)} (${order.customer_name}, R$ ${formatPrice(order.total)}).`
      )
    : "";

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/cardapio"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary sm:text-sm"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Voltar ao cardápio
          </Link>
          <Link href="/" className="group">
            <BrandMark size="sm" />
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6"
      >
        {loading && !order ? (
          <div className="space-y-6" aria-label="Carregando pedido">
            <div className="space-y-3 rounded-2xl border border-border bg-card p-6 animate-skeleton">
              <div className="h-3 w-28 rounded bg-secondary" />
              <div className="h-8 w-56 rounded bg-secondary" />
              <div className="h-3 w-48 rounded bg-secondary" />
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 animate-skeleton">
              <div className="h-6 w-48 rounded bg-secondary" />
              <div className="h-12 w-full rounded bg-secondary" />
              <div className="h-12 w-full rounded bg-secondary" />
              <div className="h-12 w-full rounded bg-secondary" />
            </div>
          </div>
        ) : error && !order ? (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-8 shadow-xs">
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Pedido não localizado
            </h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link
              href="/cardapio"
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary-hover"
            >
              Fazer novo pedido
            </Link>
          </div>
        ) : order ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground tabular-nums">
                    Pedido #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[11px] font-bold text-foreground hover:border-primary/40"
                  >
                    {copiedId ? (
                      <>
                        <Check
                          className="size-3 text-status-open"
                          aria-hidden="true"
                        />{" "}
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" aria-hidden="true" /> Copiar
                      </>
                    )}
                  </button>
                  {elapsedMin !== null &&
                    order.status !== "completed" &&
                    order.status !== "cancelled" && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                        há {elapsedMin} min
                      </span>
                    )}
                </div>
                <h1 className="font-serif text-3xl font-extrabold text-foreground">
                  Olá, {order.customer_name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Acompanhamento atualizado automaticamente a cada poucos
                  segundos.
                </p>
              </div>
              <button
                type="button"
                disabled={refreshing}
                onClick={() => fetchOrder(true)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 text-xs font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-3.5 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
                  aria-hidden="true"
                />
                {refreshing ? "Atualizando…" : "Atualizar"}
              </button>
            </div>

            {order.status === "cancelled" ? (
              <section
                aria-label="Pedido cancelado"
                aria-live="polite"
                className="space-y-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-destructive"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="size-5 shrink-0" aria-hidden="true" />
                  <h2 className="font-serif text-2xl font-bold">
                    Pedido cancelado
                  </h2>
                </div>
                <p className="text-sm text-foreground">
                  {order.notes
                    ? `Motivo informado: ${order.notes}`
                    : "Este pedido foi cancelado pela equipe."}
                </p>
              </section>
            ) : (
              <section
                aria-label="Andamento do pedido"
                aria-live="polite"
                className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6"
              >
                <h2 className="mb-5 font-serif text-xl font-bold text-foreground">
                  Andamento na cozinha
                </h2>
                <ol className="space-y-4">
                  {STEPS.map((step, index) => {
                    const completedOrActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const StepIcon = step.icon;
                    return (
                      <li
                        key={step.key}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`flex items-start gap-3.5 border-l-2 pl-4 ${
                          completedOrActive
                            ? "border-primary"
                            : "border-border opacity-55"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                            isCurrent
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : completedOrActive
                                ? "border-status-open/40 bg-status-open/10 text-status-open"
                                : "border-border bg-background text-muted-foreground"
                          }`}
                          aria-hidden="true"
                        >
                          <StepIcon className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {step.title}
                            {isCurrent ? (
                              <span className="ml-2 rounded-full bg-accent-gold-soft px-2 py-0.5 text-[11px] font-bold text-accent-gold-ink">
                                Etapa atual
                              </span>
                            ) : null}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {step.desc}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            <section
              aria-label="Resumo dos itens"
              className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6"
            >
              <h2 className="font-serif text-xl font-bold text-foreground">
                Resumo do pedido
              </h2>

              <ul className="divide-y divide-border">
                {order.items.map((item, idx) => (
                  <li key={`${item.id}-${idx}`} className="py-3 first:pt-0">
                    <div className="flex justify-between gap-4 text-sm">
                      <div>
                        <p className="font-bold text-foreground">
                          {item.qty}x{" "}
                          {item.flavors.map((f) => f.name).join(" + ")}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({item.size})
                          </span>
                        </p>
                        {item.crust && (
                          <p className="text-xs text-muted-foreground">
                            Borda: {item.crust.name}
                          </p>
                        )}
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Extras: {item.extras.map((e) => e.name).join(", ")}
                          </p>
                        )}
                        {item.removals && item.removals.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Retirar: {item.removals.join(", ")}
                          </p>
                        )}
                        {item.observation && (
                          <p className="text-xs text-muted-foreground">
                            {item.category === "combo"
                              ? item.observation
                              : `Obs.: ${item.observation}`}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-extrabold text-foreground tabular-nums">
                        R$ {formatPrice(item.price * item.qty)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-semibold tabular-nums">
                    R$ {formatPrice(order.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Entrega</dt>
                  <dd className="font-semibold tabular-nums">
                    {order.delivery_fee > 0
                      ? `R$ ${formatPrice(order.delivery_fee)}`
                      : "Grátis / Retirada"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold">
                  <dt>Total</dt>
                  <dd className="text-primary tabular-nums">
                    R$ {formatPrice(order.total)}
                  </dd>
                </div>
              </dl>

              <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Modalidade:</strong>{" "}
                  {order.delivery_type === "takeaway"
                    ? `Retirada no balcão (${profile.pickupAddress})`
                    : `Entrega: ${order.address || ""}${order.bairro ? `, ${order.bairro}` : ""}${order.complement ? ` (${order.complement})` : ""}`}
                </p>
                <p>
                  <strong className="text-foreground">Pagamento:</strong>{" "}
                  {order.payment_method}
                  {order.change_for
                    ? ` (troco para R$ ${formatPrice(order.change_for)}${troco !== null ? ` · levar R$ ${formatPrice(troco)} de troco` : ""})`
                    : ""}
                </p>
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${profile.whatsappNumber}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.985]"
              >
                <MessageSquare className="size-4" aria-hidden="true" />
                Falar no WhatsApp sobre o pedido
              </a>
              <Link
                href="/cardapio"
                className="inline-flex min-h-12 items-center rounded-xl border border-border bg-secondary px-5 text-sm font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-card"
              >
                Voltar ao cardápio
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
