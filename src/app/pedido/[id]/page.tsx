"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Clock,
  Bike,
  Store,
  CheckCircle,
  Receipt,
  ArrowLeft,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { DbOrder, OrderStatus } from "@/types/supabase";

const STEPS: {
  status: OrderStatus;
  label: string;
  desc: string;
  icon: string;
}[] = [
  {
    status: "pending",
    label: "Pedido Recebido",
    desc: "Recebemos seu pedido e já vamos enviar para a cozinha.",
    icon: "📋",
  },
  {
    status: "preparing",
    label: "No Forno & Preparo",
    desc: "Sua pizza está sendo montada e assada no forno a lenha.",
    icon: "🍕",
  },
  {
    status: "delivering",
    label: "A Caminho / Pronto",
    desc: "Saiu para entrega com o motoboy ou está pronta para retirada.",
    icon: "🛵",
  },
  {
    status: "completed",
    label: "Pedido Concluído",
    desc: "Entregue com sucesso! Bom apetite!",
    icon: "🎉",
  },
];

function stepIndex(status: OrderStatus): number {
  if (status === "pending") return 0;
  if (status === "preparing") return 1;
  if (status === "delivering") return 2;
  if (status === "completed") return 3;
  return 0;
}

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const [order, setOrder] = useState<DbOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [pixCopied, setPixCopied] = useState(false);

  const copyPixKey = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText("83993740352");
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  useEffect(() => {
    async function loadOrder() {
      // 1. Tenta carregar do Supabase se configurado
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (data) {
          setOrder(data as DbOrder);
          setLoading(false);
          return;
        }
      }

      // 2. Tenta carregar da rota API
      try {
        const res = await fetch("/api/orders");
        const json = await res.json();
        if (Array.isArray(json.orders)) {
          const found = json.orders.find((o: DbOrder) => o.id === orderId);
          if (found) {
            setOrder(found);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* ignore */
      }

      // 3. Fallback para localStorage
      try {
        const raw = localStorage.getItem("donluydd.last_order.v1");
        if (raw) {
          const local = JSON.parse(raw);
          setOrder({
            id: local.id || orderId,
            created_at: local.date || new Date().toISOString(),
            customer_name: local.customer_name || "Você",
            customer_phone: local.customer_phone || null,
            delivery_type:
              local.delivery_type || local.deliveryType || "delivery",
            address: local.address || "Endereço cadastrado",
            bairro: local.bairro || null,
            cep: local.cep || null,
            complement: local.complement || null,
            items: local.items || [],
            subtotal: local.subtotal || local.total || 0,
            delivery_fee: local.delivery_fee || 0,
            total: local.total || 0,
            payment_method: local.payment_method || "Confirmado",
            change_for: local.change_for || null,
            status: local.status || "pending",
          });
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }

    loadOrder();

    // Inscrição em tempo real no Supabase para esse pedido
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
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
            setOrder(payload.new as DbOrder);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-cream">
        <div className="size-8 animate-spin rounded-full border-2 border-yellow border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-cream">
        <Receipt className="size-16 text-muted/40 mb-3" />
        <h2 className="font-display text-2xl font-bold italic">
          Pedido não localizado
        </h2>
        <p className="mt-2 text-xs text-muted max-w-sm">
          Não encontramos o pedido solicitado. Verifique se o link está correto.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-sm bg-yellow px-5 py-2.5 text-xs font-bold text-black"
        >
          Voltar ao cardápio
        </Link>
      </div>
    );
  }

  const currentStep = stepIndex(order.status);
  const isDelivery = order.delivery_type === "delivery";

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-yellow/20 bg-[#1a1415]/90 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-yellow transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span>Voltar ao cardápio</span>
          </Link>
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            Don Luydd Pizzaria
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Status Card */}
        <div className="rounded-sm border border-yellow/25 bg-linear-to-b from-[#1c191a] to-[#141213] p-6 sm:p-8 shadow-2xl">
          <div className="text-center">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-yellow">
              Acompanhamento ao Vivo
            </span>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold italic text-cream">
              {order.customer_name
                ? `Pedido de ${order.customer_name}`
                : "Status do seu Pedido"}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5 font-mono text-xs text-muted">
              <span>Código: #{order.id.slice(0, 8)}</span>
              {order.customer_phone && (
                <>
                  <span>·</span>
                  <span>WhatsApp: {order.customer_phone}</span>
                </>
              )}
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="mt-8 space-y-6">
            {STEPS.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isFuture = idx > currentStep;

              return (
                <div key={step.status} className="flex items-start gap-4">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`flex size-11 items-center justify-center rounded-sm border text-lg transition-all ${
                        isCurrent
                          ? "border-yellow bg-yellow/20 text-yellow ring-2 ring-yellow/30 scale-105"
                          : isPast
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                            : "border-white/10 bg-white/2 text-muted/40"
                      }`}
                    >
                      {isPast ? <CheckCircle className="size-5" /> : step.icon}
                    </div>

                    {idx < STEPS.length - 1 && (
                      <div
                        className={`h-10 w-0.5 my-1 transition-colors ${
                          isPast ? "bg-emerald-500" : "bg-white/10"
                        }`}
                      />
                    )}
                  </div>

                  <div className="pt-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-display text-base font-bold italic ${
                          isCurrent
                            ? "text-yellow"
                            : isPast
                              ? "text-cream"
                              : "text-muted"
                        }`}
                      >
                        {step.label}
                      </h3>
                      {isCurrent && (
                        <span className="flex items-center gap-1 rounded-sm bg-yellow/20 px-2 py-0.5 font-mono text-[0.6rem] font-bold text-yellow border border-yellow/30 animate-pulse">
                          Atual
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs mt-0.5 leading-relaxed ${
                        isFuture ? "text-muted/60" : "text-cream-dim"
                      }`}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Banner */}
          <div className="mt-8 rounded-sm border border-white/8 bg-white/2 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-yellow" />
              <span>
                Previsão média: <strong>30 a 45 minutos</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isDelivery ? (
                <>
                  <Bike className="size-4 text-yellow" />
                  <span>Entrega via motoboy</span>
                </>
              ) : (
                <>
                  <Store className="size-4 text-yellow" />
                  <span>Retirada no balcão da pizzaria</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Order Details Accordion / Summary */}
        <div className="mt-6 rounded-sm border border-white/10 bg-[#161415] p-6 shadow-xl space-y-4">
          <h2 className="font-display text-lg font-bold italic text-cream">
            Resumo do Pedido
          </h2>

          <ul className="space-y-2 border-b border-white/8 pb-4">
            {order.items.map((it, idx) => (
              <li
                key={idx}
                className="flex items-start justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-cream">
                    {it.qty}x {it.flavors.map((f) => f.name).join(" + ")}
                  </span>
                  <div className="text-[0.68rem] text-muted">
                    Tamanho {it.size}
                    {it.crust && ` · Borda: ${it.crust.name}`}
                  </div>
                </div>
                <span className="font-mono text-yellow font-bold">
                  R$ {formatPrice(it.price * it.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-baseline pt-2">
            <div>
              <span className="text-sm font-bold text-cream block">
                Total do Pedido
              </span>
              <span className="text-[0.68rem] text-muted block">
                Pagamento: <strong>{order.payment_method}</strong>
              </span>
              <span className="text-[0.68rem] text-muted block mt-0.5">
                {order.delivery_type === "delivery" ? (
                  <>
                    📍 Entrega em:{" "}
                    <strong>
                      {order.address}
                      {order.bairro ? `, ${order.bairro}` : ""}
                      {order.complement ? ` (${order.complement})` : ""}
                    </strong>
                  </>
                ) : (
                  <>
                    🏬 Retirada:{" "}
                    <strong>Av. Epitácio Pessoa, 1200 - Centro</strong>
                  </>
                )}
              </span>
            </div>
            <span className="font-display text-2xl font-bold text-yellow shrink-0">
              R$ {formatPrice(order.total)}
            </span>
          </div>

          {/* Box de Chave PIX se pagamento for PIX */}
          {order.payment_method?.toUpperCase().includes("PIX") && (
            <div className="rounded-sm border border-yellow/40 bg-yellow/10 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[0.62rem] font-bold uppercase tracking-wider text-yellow">
                    Chave PIX Don Luydd
                  </span>
                  <p className="text-xs text-cream font-bold mt-0.5 font-mono">
                    (83) 99374-0352
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyPixKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-yellow text-black text-xs font-bold transition-all hover:brightness-110 active:scale-95 cursor-pointer shrink-0"
                >
                  {pixCopied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{pixCopied ? "Chave Copiada!" : "Copiar Chave"}</span>
                </button>
              </div>
              <p className="text-[0.68rem] text-muted">
                Após transferir os R$ {formatPrice(order.total)}, você pode
                enviar o comprovante pelo WhatsApp abaixo para agilizar a
                liberação.
              </p>
            </div>
          )}

          {/* Need help button */}
          <a
            href={`https://wa.me/5583993740352?text=${encodeURIComponent(
              `Olá! Fiz o pedido #${order.id.slice(0, 8)} pelo cardápio e gostaria de acompanhar.`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-[#25d366]/30 bg-[#25d366]/10 py-3.5 text-xs font-bold text-[#25d366] transition-all hover:bg-[#25d366]/20 cursor-pointer"
          >
            <MessageCircle className="size-4" />
            Falar com a Pizzaria no WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
