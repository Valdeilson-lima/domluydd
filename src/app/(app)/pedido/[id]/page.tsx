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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { calculateChange } from "@/lib/pricing";
import {
  STORE_PICKUP_ADDRESS,
  STORE_SHORT_NAME,
  STORE_WHATSAPP_NUMBER,
} from "@/lib/store-config";
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
    desc: "Atendimento finalizado. Bom apetite.",
    icon: CheckCircle2,
  },
];

export default function PedidoTrackingPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";

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

    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null =
      null;
    if (isSupabaseConfigured && supabase && orderId) {
      channel = supabase
        .channel(`order-track-${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            const next = payload.new as DbOrder;
            setOrder(next);
            updateLastOrderStatus(next.id, next.status);
          }
        )
        .subscribe();
    }

    return () => {
      window.clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchOrder, orderId]);

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
        `Olá ${STORE_SHORT_NAME}! Gostaria de acompanhar meu pedido #${order.id.slice(0, 8)} (${order.customer_name}, R$ ${formatPrice(order.total)}).`
      )
    : "";

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/cardapio"
            className="inline-flex min-h-11 items-center gap-2 border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-foreground sm:text-sm"
            style={{ borderRadius: "2px" }}
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Voltar ao cardápio
          </Link>
          <span translate="no" className="font-serif text-lg text-foreground">
            {STORE_SHORT_NAME}
          </span>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6"
      >
        {loading && !order ? (
          <div className="space-y-6" aria-label="Carregando pedido">
            <div className="space-y-3 border border-border bg-card p-6 animate-skeleton">
              <div className="h-3 w-28 bg-secondary" />
              <div className="h-8 w-56 bg-secondary" />
              <div className="h-3 w-48 bg-secondary" />
            </div>
            <div className="space-y-4 border border-border bg-card p-6 animate-skeleton">
              <div className="h-6 w-48 bg-secondary" />
              <div className="h-12 w-full bg-secondary" />
              <div className="h-12 w-full bg-secondary" />
              <div className="h-12 w-full bg-secondary" />
            </div>
          </div>
        ) : error && !order ? (
          <div className="space-y-4 border border-border bg-card p-8">
            <h1 className="font-serif text-2xl text-foreground">
              Pedido não localizado
            </h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link
              href="/cardapio"
              className="inline-flex min-h-11 items-center bg-primary px-5 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
              style={{ borderRadius: "2px" }}
            >
              Fazer novo pedido
            </Link>
          </div>
        ) : order ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 border border-border bg-card p-5 sm:p-6">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
                    Pedido #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex min-h-8 items-center gap-1 border border-border bg-background px-2 text-[11px] font-semibold text-foreground hover:border-foreground"
                    style={{ borderRadius: "2px" }}
                  >
                    {copiedId ? (
                      <>
                        <Check className="size-3" aria-hidden="true" /> Copiado
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
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        · há {elapsedMin} min
                      </span>
                    )}
                </div>
                <h1 className="font-serif text-3xl font-normal text-foreground">
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
                className="inline-flex min-h-11 items-center gap-1.5 border border-border bg-background px-3.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground hover:bg-secondary disabled:opacity-50"
                style={{ borderRadius: "2px" }}
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
                className="space-y-2 border border-foreground bg-secondary p-5"
              >
                <div className="flex items-center gap-2 text-foreground">
                  <XCircle className="size-5 shrink-0" aria-hidden="true" />
                  <h2 className="font-serif text-2xl text-foreground">
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
                className="border border-border bg-card p-5 sm:p-6"
              >
                <h2 className="mb-5 font-serif text-xl text-foreground">
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
                            ? "border-foreground"
                            : "border-border opacity-55"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center border ${
                            isCurrent
                              ? "border-foreground bg-primary text-primary-foreground"
                              : completedOrActive
                                ? "border-foreground bg-secondary text-foreground"
                                : "border-border bg-background text-muted-foreground"
                          }`}
                          aria-hidden="true"
                        >
                          <StepIcon className="size-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {step.title}
                            {isCurrent ? " (Etapa atual)" : ""}
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
              className="space-y-4 border border-border bg-card p-5 sm:p-6"
            >
              <h2 className="font-serif text-xl text-foreground">
                Resumo do pedido
              </h2>

              <ul className="divide-y divide-border">
                {order.items.map((item, idx) => (
                  <li key={`${item.id}-${idx}`} className="py-3 first:pt-0">
                    <div className="flex justify-between gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">
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
                            Obs.: {item.observation}
                          </p>
                        )}
                      </div>
                      <p className="font-mono text-sm font-semibold text-foreground tabular-nums">
                        R$ {formatPrice(item.price * item.qty)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-mono tabular-nums">
                    R$ {formatPrice(order.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Entrega</dt>
                  <dd className="font-mono tabular-nums">
                    {order.delivery_fee > 0
                      ? `R$ ${formatPrice(order.delivery_fee)}`
                      : "Grátis / Retirada"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="font-mono tabular-nums">
                    R$ {formatPrice(order.total)}
                  </dd>
                </div>
              </dl>

              <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Modalidade:</strong>{" "}
                  {order.delivery_type === "takeaway"
                    ? `Retirada no balcão (${STORE_PICKUP_ADDRESS})`
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
                href={`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.985]"
                style={{ borderRadius: "2px" }}
              >
                <MessageSquare className="size-4" aria-hidden="true" />
                Falar no WhatsApp sobre o pedido
              </a>
              <Link
                href="/cardapio"
                className="inline-flex min-h-11 items-center border border-border bg-secondary px-5 text-sm font-semibold text-foreground transition-colors hover:border-foreground hover:bg-background"
                style={{ borderRadius: "2px" }}
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
