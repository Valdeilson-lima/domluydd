"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageSquare, RefreshCw } from "lucide-react";
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

const STEPS: Array<{ key: OrderStatus; title: string; desc: string }> = [
  {
    key: "pending",
    title: "Pedido recebido",
    desc: "Aguardando confirmação da cozinha.",
  },
  {
    key: "preparing",
    title: "Em preparo no forno",
    desc: "Massa aberta e assada na pedra.",
  },
  {
    key: "delivering",
    title: "Pronto / Saiu para entrega",
    desc: "A caminho do seu endereço ou pronto no balcão.",
  },
  {
    key: "completed",
    title: "Entregue / Concluído",
    desc: "Pedido finalizado.",
  },
];

export default function PedidoTrackingPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";

  const [order, setOrder] = useState<DbOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
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
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();

    const interval = window.setInterval(() => {
      fetchOrder();
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/cardapio"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao cardápio
          </Link>
          <span className="font-serif text-lg text-foreground">
            {STORE_SHORT_NAME}
          </span>
        </div>
      </header>

      <main
        id="conteudo-principal"
        className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6"
      >
        {loading && !order ? (
          <div className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Carregando status do pedido…
          </div>
        ) : error && !order ? (
          <div className="space-y-4 border border-border bg-card p-8">
            <h1 className="font-serif text-2xl text-foreground">
              Pedido não localizado
            </h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Link
              href="/cardapio"
              className="inline-flex h-10 items-center bg-primary px-4 text-xs font-semibold text-primary-foreground"
              style={{ borderRadius: "2px" }}
            >
              Fazer novo pedido
            </Link>
          </div>
        ) : order ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4 border border-border bg-card p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Pedido #{order.id.slice(0, 8)}
                </p>
                <h1 className="mt-1 font-serif text-3xl font-normal text-foreground">
                  Olá, {order.customer_name}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Atualizado em tempo real a cada poucos segundos.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchOrder}
                className="inline-flex h-9 items-center gap-1.5 border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-secondary"
                style={{ borderRadius: "2px" }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </button>
            </div>

            {order.status === "cancelled" ? (
              <section
                aria-label="Pedido cancelado"
                className="border border-foreground bg-secondary p-5 space-y-2"
              >
                <h2 className="font-serif text-2xl text-foreground">
                  Pedido cancelado
                </h2>
                <p className="text-sm text-foreground">
                  {order.notes
                    ? `Motivo informado: ${order.notes}`
                    : "Este pedido foi cancelado pela equipe."}
                </p>
              </section>
            ) : (
              <section
                aria-label="Andamento do pedido"
                className="border border-border bg-card p-5"
              >
                <h2 className="mb-4 font-serif text-xl text-foreground">
                  Andamento na cozinha
                </h2>
                <ol className="space-y-4">
                  {STEPS.map((step, index) => {
                    const completedOrActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                      <li
                        key={step.key}
                        className={`flex items-start gap-3 border-l-2 pl-4 ${
                          completedOrActive
                            ? "border-foreground"
                            : "border-border opacity-55"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {step.title}
                            {isCurrent ? " (Atual)" : ""}
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
              className="border border-border bg-card p-5 space-y-4"
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

              <dl className="space-y-1 border-t border-border pt-3 text-sm">
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
                <div className="flex justify-between border-t border-border pt-2 font-semibold text-base">
                  <dt>Total</dt>
                  <dd className="font-mono tabular-nums">
                    R$ {formatPrice(order.total)}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-border pt-3 text-xs text-muted-foreground space-y-1">
                <p>
                  <strong className="text-foreground">Modalidade:</strong>{" "}
                  {order.delivery_type === "takeaway"
                    ? `Retirada no balcão (${STORE_PICKUP_ADDRESS})`
                    : `Entrega — ${order.address || ""}${order.bairro ? `, ${order.bairro}` : ""}${order.complement ? ` (${order.complement})` : ""}`}
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
                className="inline-flex h-11 items-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                style={{ borderRadius: "2px" }}
              >
                <MessageSquare className="h-4 w-4" />
                Falar no WhatsApp sobre o pedido
              </a>
              <Link
                href="/cardapio"
                className="inline-flex h-11 items-center border border-border bg-secondary px-5 text-sm font-semibold text-foreground transition-colors hover:bg-background"
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
