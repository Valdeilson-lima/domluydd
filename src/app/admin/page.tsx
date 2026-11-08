"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Clock,
  Bike,
  Store,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  MessageCircle,
  Printer,
  Flame,
  Search,
  Lock,
  ArrowLeft,
  RotateCw,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { DbOrder, OrderStatus } from "@/types/supabase";

const STATUS_LABELS: Record<
  OrderStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  pending: {
    label: "Pendente (Novo)",
    bg: "bg-amber-500/15 border-amber-500/30",
    text: "text-amber-400",
    icon: "🔔",
  },
  preparing: {
    label: "No Forno (Em Preparo)",
    bg: "bg-red-500/15 border-red-500/30",
    text: "text-red-400",
    icon: "🍕",
  },
  delivering: {
    label: "A Caminho / Pronto",
    bg: "bg-blue-500/15 border-blue-500/30",
    text: "text-blue-400",
    icon: "🛵",
  },
  completed: {
    label: "Concluído",
    bg: "bg-emerald-500/15 border-emerald-500/30",
    text: "text-emerald-400",
    icon: "✅",
  },
  cancelled: {
    label: "Cancelado",
    bg: "bg-zinc-500/15 border-zinc-500/30",
    text: "text-zinc-400",
    icon: "❌",
  },
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [search, setSearch] = useState("");

  // Toca alerta sonoro via Web Audio API
  const playAlertSound = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {
      /* ignore audio error */
    }
  }, [soundEnabled]);

  // Carrega pedidos
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  // Verifica login salvo na sessão
  useEffect(() => {
    if (sessionStorage.getItem("donluydd.admin.auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Inscreve no Supabase Realtime quando autenticado
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();

    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel("admin-orders-stream")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            const newOrder = payload.new as DbOrder;
            setOrders((prev) => [newOrder, ...prev]);
            playAlertSound();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
          },
          (payload) => {
            const updated = payload.new as DbOrder;
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, fetchOrders, playAlertSound]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN padrão da pizzaria: 1234
    if (pin === "1234") {
      sessionStorage.setItem("donluydd.admin.auth", "true");
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    // Atualização otimista
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      /* ignore */
    }
  };

  const handlePrint = (order: DbOrder) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = order.items
      .map((it) => {
        const flavors = it.flavors.map((f) => f.name).join(" + ");
        const crust = it.crust ? `<br/>🧀 Borda: ${it.crust.name}` : "";
        const extras =
          it.extras && it.extras.length > 0
            ? `<br/>🥓 Extras: ${it.extras.map((e) => e.name).join(", ")}`
            : "";
        const removals =
          it.removals && it.removals.length > 0
            ? `<br/>❌ Sem: ${it.removals.join(", ")}`
            : "";
        const obs = it.observation ? `<br/>📝 Obs: ${it.observation}` : "";

        return `
          <div style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #ccc;">
            <strong>${it.qty}x ${flavors} (${it.size})</strong> - R$ ${formatPrice(it.price * it.qty)}
            <div style="font-size: 11px; color: #555;">
              ${crust}${extras}${removals}${obs}
            </div>
          </div>
        `;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda #${order.id.slice(0, 6)}</title>
          <style>
            body { font-family: monospace; font-size: 12px; width: 280px; margin: 0; padding: 10px; }
            h2 { text-align: center; margin: 0 0 5px 0; font-size: 16px; }
            .center { text-align: center; }
            .divider { border-bottom: 1px solid #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <h2>🍕 DON LUYDD PIZZARIA</h2>
          <div class="center">Comanda de Produção</div>
          <div class="divider"></div>
          <div><strong>Pedido:</strong> #${order.id.slice(0, 8)}</div>
          <div><strong>Data:</strong> ${new Date(order.created_at).toLocaleString("pt-BR")}</div>
          <div><strong>Cliente:</strong> ${order.customer_name}</div>
          <div><strong>Tipo:</strong> ${order.delivery_type === "delivery" ? "MOTOBOY / ENTREGA" : "RETIRADA NO BALCÃO"}</div>
          ${order.address ? `<div><strong>Endereço:</strong> ${order.address} - ${order.bairro || ""}</div>` : ""}
          <div class="divider"></div>
          <div><strong>ITENS:</strong></div>
          ${itemsHtml}
          <div class="divider"></div>
          <div><strong>TOTAL: R$ ${formatPrice(order.total)}</strong></div>
          <div>Pagamento: ${order.payment_method}</div>
          <div class="divider"></div>
          <div class="center" style="font-size: 10px;">donluydd.com.br</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleNotifyWhatsApp = (order: DbOrder) => {
    if (!order.customer_phone) return;
    const cleanPhone = order.customer_phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;

    let msg = `Olá, *${order.customer_name}*! Aqui é da *Don Luydd Pizzaria* 🍕\n\n`;

    if (order.status === "preparing") {
      msg += `Seu pedido já está no forno sendo preparado com muito carinho! 🔥 Em breve estará pronto.`;
    } else if (order.status === "delivering") {
      if (order.delivery_type === "delivery") {
        msg += `Boa notícia! Seu pedido acabou de sair para entrega com nosso motoboy 🛵. Já já chega quentinho aí!`;
      } else {
        msg += `Seu pedido está prontinho e quentinho aguardando sua retirada no balcão! 🏬`;
      }
    } else if (order.status === "completed") {
      msg += `Seu pedido foi finalizado com sucesso! Muito obrigado pela preferência e bom apetite! ❤️🍕`;
    } else {
      msg += `Recebemos seu pedido com sucesso e já vamos iniciar o preparo!`;
    }

    msg += `\n\nAcompanhe seu pedido em tempo real pelo link:\n${window.location.origin}/pedido/${order.id}`;

    window.open(
      `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  // Métricas do Turno
  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.created_at).toDateString() === today
    );
    const totalSales = todayOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const activeCount = orders.filter(
      (o) =>
        o.status === "pending" ||
        o.status === "preparing" ||
        o.status === "delivering"
    ).length;

    return {
      todayCount: todayOrders.length,
      totalSales,
      activeCount,
    };
  }, [orders]);

  // Filtragem de pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (o.customer_phone && o.customer_phone.includes(search)) ||
        o.id.includes(search);

      if (!matchSearch) return false;

      if (activeTab === "active") {
        return (
          o.status === "pending" ||
          o.status === "preparing" ||
          o.status === "delivering"
        );
      }
      return o.status === "completed" || o.status === "cancelled";
    });
  }, [orders, activeTab, search]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-cream">
        <div className="w-full max-w-sm rounded-3xl border border-yellow/20 bg-linear-to-b from-[#1c191a] to-[#121011] p-8 shadow-2xl text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-yellow/15 text-yellow ring-1 ring-yellow/30">
            <Lock className="size-6" />
          </div>

          <h2 className="font-display text-2xl font-bold italic text-cream">
            Painel da Cozinha
          </h2>
          <p className="mt-1 text-xs text-muted">
            Área restrita da Don Luydd Pizzaria.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Digite o PIN de acesso (1234)"
              className="w-full text-center tracking-[0.4em] font-mono text-lg rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-cream outline-none focus:border-yellow"
            />

            {pinError && (
              <p className="text-xs font-bold text-red-light">
                PIN incorreto. (PIN padrão: 1234)
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-linear-to-r from-red-primary to-yellow py-3 text-xs font-bold text-black shadow-lg transition-all hover:brightness-110 active:scale-95 cursor-pointer"
            >
              Entrar no Painel
            </button>
          </form>

          <div className="mt-6 border-t border-white/8 pt-4">
            <Link
              href="/"
              className="text-xs text-muted hover:text-yellow transition-colors"
            >
              ← Voltar ao cardápio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121011] text-cream pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-100 border-b border-yellow/25 bg-[#1a1415]/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-muted transition-colors hover:text-yellow hover:border-yellow"
              title="Voltar ao cardápio"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-bold italic text-cream sm:text-xl">
                  Painel da Cozinha & Balcão
                </h1>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[0.6rem] font-bold text-emerald-400 border border-emerald-500/30">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ao Vivo
                </span>
              </div>
              <span className="text-[0.68rem] text-muted">
                Don Luydd Pizzaria · Pedidos em tempo real
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? "border-yellow/40 bg-yellow/15 text-yellow"
                  : "border-white/10 bg-white/4 text-muted"
              }`}
              title={soundEnabled ? "Som ativado" : "Som desativado"}
            >
              {soundEnabled ? (
                <Volume2 className="size-4" />
              ) : (
                <VolumeX className="size-4" />
              )}
              <span className="hidden sm:inline">
                {soundEnabled ? "Alerta Sonoro Ativo" : "Alerta Mudo"}
              </span>
            </button>

            <button
              type="button"
              onClick={fetchOrders}
              className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-muted transition-colors hover:text-cream"
              title="Atualizar lista"
            >
              <RotateCw className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Aviso Supabase se ainda não configurado */}
        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-cream-dim space-y-1">
                <p className="font-bold text-amber-300 text-sm">
                  Supabase ainda não conectado
                </p>
                <p>
                  Para sincronizar pedidos em tempo real via nuvem, crie seu
                  projeto gratuito no Supabase, execute o script{" "}
                  <code className="text-yellow bg-black/40 px-1.5 py-0.5 rounded">
                    supabase/schema.sql
                  </code>{" "}
                  e adicione as chaves no arquivo{" "}
                  <code className="text-yellow bg-black/40 px-1.5 py-0.5 rounded">
                    .env.local
                  </code>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="rounded-2xl border border-white/8 bg-linear-to-b from-[#1c191a] to-[#141213] p-4">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-muted">
              Faturamento Hoje
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-yellow sm:text-3xl">
                R$ {formatPrice(metrics.totalSales)}
              </span>
            </div>
            <span className="text-[0.65rem] text-muted">
              {metrics.todayCount} pedidos registrados hoje
            </span>
          </div>

          <div className="rounded-2xl border border-yellow/30 bg-yellow/10 p-4">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-yellow">
              Pedidos Ativos na Cozinha
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-yellow sm:text-3xl">
                {metrics.activeCount}
              </span>
              <span className="text-xs text-cream">em produção</span>
            </div>
            <span className="text-[0.65rem] text-muted">
              Pendentes ou no forno
            </span>
          </div>

          <div className="rounded-2xl border border-white/8 bg-linear-to-b from-[#1c191a] to-[#141213] p-4">
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-muted">
              Tempo Médio de Preparo
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-cream sm:text-3xl">
                25~35 min
              </span>
            </div>
            <span className="text-[0.65rem] text-muted">Meta da pizzaria</span>
          </div>
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-yellow text-black shadow-md"
                  : "bg-white/4 text-muted hover:text-cream"
              }`}
            >
              Em Produção ({metrics.activeCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "completed"
                  ? "bg-yellow text-black shadow-md"
                  : "bg-white/4 text-muted hover:text-cream"
              }`}
            >
              Concluídos / Histórico
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente ou ID..."
              className="w-full rounded-xl border border-white/10 bg-black/60 pl-9 pr-3 py-2 text-xs text-cream outline-none focus:border-yellow"
            />
          </div>
        </div>

        {/* Orders Grid / Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-yellow border-t-transparent" />
            <p className="mt-3 text-xs text-muted">Carregando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-white/8 bg-white/2">
            <Receipt className="size-12 text-muted/40 mb-3" />
            <p className="font-display text-lg font-bold text-cream">
              {activeTab === "active"
                ? "Nenhum pedido em produção no momento"
                : "Nenhum pedido concluído encontrado"}
            </p>
            <p className="text-xs text-muted mt-1 max-w-sm">
              Assim que um cliente enviar um pedido pelo cardápio, ele surgirá
              aqui automaticamente com alerta sonoro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const statusCfg =
                STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
              const isDelivery = order.delivery_type === "delivery";
              const timeFormatted = new Date(
                order.created_at
              ).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={order.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-linear-to-b from-[#1c191a] to-[#141213] p-4 shadow-xl transition-all hover:border-yellow/40"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-white/8 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-yellow">
                            #{order.id.slice(0, 6)}
                          </span>
                          <span className="text-[0.68rem] text-muted flex items-center gap-1">
                            <Clock className="size-3" />
                            {timeFormatted}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-cream mt-0.5">
                          {order.customer_name}
                        </h3>
                        {order.customer_phone && (
                          <span className="font-mono text-xs text-cream-dim">
                            {order.customer_phone}
                          </span>
                        )}
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[0.62rem] font-bold ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        <span>{statusCfg.icon}</span>
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>

                    {/* Delivery / Takeaway Info */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-cream-dim">
                      {isDelivery ? (
                        <>
                          <Bike className="size-3.5 text-yellow shrink-0" />
                          <span className="truncate">
                            Entrega: {order.address || "Endereço"}
                            {order.bairro ? ` (${order.bairro})` : ""}
                          </span>
                        </>
                      ) : (
                        <>
                          <Store className="size-3.5 text-yellow shrink-0" />
                          <span className="text-yellow font-bold">
                            Retirada no Balcão da Pizzaria
                          </span>
                        </>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="mt-3 space-y-2 border-t border-white/6 pt-3">
                      {order.items.map((it, idx) => {
                        const flavors = it.flavors
                          .map((f) => f.name)
                          .join(" + ");
                        return (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/5 bg-black/40 p-2 text-xs"
                          >
                            <div className="flex justify-between font-bold text-cream">
                              <span>
                                {it.qty}x {flavors}
                              </span>
                              <span className="font-mono text-yellow">
                                R$ {formatPrice(it.price * it.qty)}
                              </span>
                            </div>
                            <div className="text-[0.68rem] text-muted mt-0.5">
                              Tamanho: <strong>{it.size}</strong>
                              {it.crust && (
                                <span className="text-yellow ml-2">
                                  🧀 {it.crust.name}
                                </span>
                              )}
                              {it.extras && it.extras.length > 0 && (
                                <span className="text-cream-dim ml-2">
                                  🥓 {it.extras.map((e) => e.name).join(", ")}
                                </span>
                              )}
                              {it.removals && it.removals.length > 0 && (
                                <span className="text-red-400 ml-2">
                                  ❌ Sem: {it.removals.join(", ")}
                                </span>
                              )}
                            </div>
                            {it.observation && (
                              <p className="mt-1 text-[0.65rem] italic text-yellow/90">
                                Obs: {it.observation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Bottom / Actions */}
                  <div className="mt-4 border-t border-white/8 pt-3 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">
                        Pagamento: <strong>{order.payment_method}</strong>
                      </span>
                      <span className="font-display text-base font-bold text-yellow">
                        Total: R$ {formatPrice(order.total)}
                      </span>
                    </div>

                    {/* Workflow status advance buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {order.status === "pending" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(order.id, "preparing")
                          }
                          className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-red-primary to-yellow py-2.5 text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
                        >
                          <Flame className="size-4" />
                          Colocar no Forno (Iniciar)
                        </button>
                      )}

                      {order.status === "preparing" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(order.id, "delivering")
                          }
                          className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
                        >
                          <Bike className="size-4" />
                          {isDelivery
                            ? "Despachar com Motoboy"
                            : "Pronto para Retirada"}
                        </button>
                      )}

                      {order.status === "delivering" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateStatus(order.id, "completed")
                          }
                          className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-600 to-green-500 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
                        >
                          <CheckCircle className="size-4" />
                          Concluir Pedido
                        </button>
                      )}

                      {/* Secondary Action: Print Comanda */}
                      <button
                        type="button"
                        onClick={() => handlePrint(order)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/4 py-2 text-xs font-bold text-cream-dim hover:text-cream hover:bg-white/10 cursor-pointer"
                      >
                        <Printer className="size-3.5" />
                        Imprimir
                      </button>

                      {/* Secondary Action: Notify WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleNotifyWhatsApp(order)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#25d366]/30 bg-[#25d366]/10 py-2 text-xs font-bold text-[#25d366] hover:bg-[#25d366]/20 cursor-pointer"
                      >
                        <MessageCircle className="size-3.5" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
