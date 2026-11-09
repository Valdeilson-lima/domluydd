"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Clock,
  Bike,
  Store,
  CheckCircle,
  Volume2,
  VolumeX,
  MessageCircle,
  Printer,
  Flame,
  Search,
  Lock,
  ArrowLeft,
  RotateCw,
  Usb,
  Maximize,
  Minimize,
  Columns3,
  LayoutGrid,
  AlertTriangle,
  Ban,
  X,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { DbOrder, OrderStatus } from "@/types/supabase";
import {
  printOrderViaBrowser,
  printOrderViaWebUsb,
  requestEpsonUsbDevice,
  printClosingReportViaBrowser,
  printClosingReportViaWebUsb,
  type USBDevice,
  type ClosingReportData,
} from "@/lib/escpos";
import { salgadas, doces, EXTRA_INGREDIENTS } from "@/data/pizzas";
import { showToast } from "@/components/ui/toast-helpers";

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
    label: "No Forno (Preparo)",
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
  const [viewMode, setViewMode] = useState<"kanban" | "grid">("grid");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "delivery" | "takeaway" | "delayed" | "notes"
  >("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modais adicionais
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [cancelModalOrder, setCancelModalOrder] = useState<DbOrder | null>(
    null
  );
  const [cancelReason, setCancelReason] = useState("");

  // Estoque e itens pausados
  const [pausedItems, setPausedItems] = useState<string[]>([]);

  // Timer para atualização periódica dos SLAs (a cada 30 segundos)
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Monitor de Tela Cheia
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Carrega itens pausados da API
  const fetchStock = useCallback(async () => {
    try {
      const res = await fetch("/api/stock");
      const data = await res.json();
      if (Array.isArray(data.pausedItems)) {
        setPausedItems(data.pausedItems);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleToggleStockItem = async (itemName: string) => {
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleItem: itemName }),
      });
      const data = await res.json();
      if (Array.isArray(data.pausedItems)) {
        setPausedItems(data.pausedItems);
        const isNowPaused = data.pausedItems.includes(itemName);
        showToast(
          isNowPaused
            ? `"${itemName}" pausado no cardápio.`
            : `"${itemName}" reativado no cardápio!`
        );
      }
    } catch {
      showToast("Erro ao atualizar disponibilidade.");
    }
  };

  // Configurações de Impressão da Epson TM-T20
  const [autoPrint, setAutoPrint] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("donluydd.admin.autoprint");
    return saved !== null ? saved === "true" : true;
  });

  const [printMode, setPrintMode] = useState<"browser" | "webusb">(() => {
    if (typeof window === "undefined") return "browser";
    return (
      (localStorage.getItem("donluydd.admin.printmode") as
        "browser" | "webusb") || "browser"
    );
  });

  const [usbDevice, setUsbDevice] = useState<USBDevice | null>(null);
  const [usbDeviceName, setUsbDeviceName] = useState("");

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

  // Executa impressão no modo configurado (WebUSB ou Browser / Kiosk)
  const executePrint = useCallback(
    async (order: DbOrder) => {
      if (printMode === "webusb" && usbDevice) {
        try {
          await printOrderViaWebUsb(usbDevice, order);
          showToast("Comanda impressa na Epson TM-T20 via USB!");
          return;
        } catch (e) {
          console.error("Falha ao imprimir via USB, usando navegador:", e);
        }
      }
      printOrderViaBrowser(order);
    },
    [printMode, usbDevice]
  );

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
    fetchStock();

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

            if (autoPrint) {
              executePrint(newOrder);
            }
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
  }, [
    isAuthenticated,
    fetchOrders,
    fetchStock,
    playAlertSound,
    autoPrint,
    executePrint,
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      sessionStorage.setItem("donluydd.admin.auth", "true");
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleToggleAutoPrint = () => {
    const next = !autoPrint;
    setAutoPrint(next);
    localStorage.setItem("donluydd.admin.autoprint", String(next));
    showToast(
      next ? "Impressão automática ATIVADA" : "Impressão automática DESATIVADA"
    );
  };

  const handleSetPrintMode = (mode: "browser" | "webusb") => {
    setPrintMode(mode);
    localStorage.setItem("donluydd.admin.printmode", mode);
  };

  const handleConnectUsb = async () => {
    try {
      const device = await requestEpsonUsbDevice();
      setUsbDevice(device);
      setUsbDeviceName(device.productName || "Epson TM-T20");
      setPrintMode("webusb");
      localStorage.setItem("donluydd.admin.printmode", "webusb");
      showToast("Epson TM-T20 conectada via USB com sucesso!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao conectar impressora.";
      showToast(msg);
    }
  };

  const handleTestPrint = () => {
    const testOrder: DbOrder = {
      id: "teste-epson-tmt20",
      created_at: new Date().toISOString(),
      customer_name: "Teste de Impressão",
      customer_phone: "(83) 99374-0352",
      delivery_type: "delivery",
      address: "Av. Epitácio Pessoa, 1200",
      bairro: "Tambauzinho",
      cep: "58000-000",
      complement: "Sala de Testes",
      items: [
        {
          id: 1,
          flavors: [
            { name: "4 Queijos", price: 40 },
            { name: "Calabresa", price: 35 },
          ],
          size: "G",
          price: 48,
          category: "Pizza Salgada",
          qty: 1,
          crust: { name: "Borda de Catupiry", price: 8 },
          extras: [{ name: "Bacon Crocante Extra", price: 5 }],
          removals: ["Sem Cebola"],
          observation: "Comanda teste Epson TM-T20 (80mm)",
        },
      ],
      subtotal: 48,
      delivery_fee: 6,
      total: 54,
      payment_method: "PIX",
      change_for: null,
      status: "pending",
    };

    executePrint(testOrder);
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      showToast(`Pedido atualizado para: ${STATUS_LABELS[status].label}`);
    } catch {
      /* ignore */
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    const id = cancelModalOrder.id;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o))
    );
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      showToast(`Pedido #${id.slice(0, 6)} cancelado.`);
    } catch {
      /* ignore */
    }
    setCancelModalOrder(null);
    setCancelReason("");
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

  // Cálculo de SLA (Tempo decorrido)
  const getSlaInfo = useCallback((createdAt: string) => {
    const elapsedMinutes = Math.max(
      0,
      Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    );
    if (elapsedMinutes < 15) {
      return {
        minutes: elapsedMinutes,
        status: "normal" as const,
        badgeBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        label: `${elapsedMinutes} min (No Prazo)`,
      };
    }
    if (elapsedMinutes <= 30) {
      return {
        minutes: elapsedMinutes,
        status: "warning" as const,
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        label: `${elapsedMinutes} min (Atenção)`,
      };
    }
    return {
      minutes: elapsedMinutes,
      status: "delayed" as const,
      badgeBg:
        "bg-red-500/30 text-red-300 border-red-500/60 font-black animate-pulse",
      label: `⚠️ ${elapsedMinutes} min (Atrasado!)`,
    };
  }, []);

  // Métricas do Turno
  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.created_at).toDateString() === today
    );
    const validToday = todayOrders.filter((o) => o.status !== "cancelled");
    const totalSales = validToday.reduce((sum, o) => sum + Number(o.total), 0);
    const activeCount = orders.filter(
      (o) =>
        o.status === "pending" ||
        o.status === "preparing" ||
        o.status === "delivering"
    ).length;

    // Métodos de pagamento
    const paymentBreakdown = {
      pix: { count: 0, total: 0 },
      cartao: { count: 0, total: 0 },
      dinheiro: { count: 0, total: 0 },
      outro: { count: 0, total: 0 },
    };

    let deliveryCount = 0;
    let takeawayCount = 0;
    let totalDeliveryFees = 0;

    validToday.forEach((o) => {
      const pm = (o.payment_method || "").toUpperCase();
      const val = Number(o.total);
      if (pm.includes("PIX")) {
        paymentBreakdown.pix.count++;
        paymentBreakdown.pix.total += val;
      } else if (
        pm.includes("CART") ||
        pm.includes("CRED") ||
        pm.includes("DEB")
      ) {
        paymentBreakdown.cartao.count++;
        paymentBreakdown.cartao.total += val;
      } else if (pm.includes("DINHEIRO")) {
        paymentBreakdown.dinheiro.count++;
        paymentBreakdown.dinheiro.total += val;
      } else {
        paymentBreakdown.outro.count++;
        paymentBreakdown.outro.total += val;
      }

      if (o.delivery_type === "delivery") {
        deliveryCount++;
        totalDeliveryFees += Number(o.delivery_fee || 0);
      } else {
        takeawayCount++;
      }
    });

    const cancelledCount = todayOrders.filter(
      (o) => o.status === "cancelled"
    ).length;
    const averageTicket =
      validToday.length > 0 ? totalSales / validToday.length : 0;

    return {
      todayCount: validToday.length,
      totalSales,
      activeCount,
      averageTicket,
      paymentBreakdown,
      deliveryCount,
      takeawayCount,
      totalDeliveryFees,
      cancelledCount,
    };
  }, [orders]);

  // Resumo Mise en place da Fila do Forno
  const ovenSummary = useMemo(() => {
    const activeOrders = orders.filter(
      (o) => o.status === "pending" || o.status === "preparing"
    );

    let totalPizzas = 0;
    const sizes: Record<string, number> = {};
    const flavors: Record<string, number> = {};
    const crusts: Record<string, number> = {};
    const extras: Record<string, number> = {};
    const removals: Record<string, number> = {};
    const drinks: Record<string, number> = {};

    activeOrders.forEach((o) => {
      o.items.forEach((it) => {
        const qty = it.qty || 1;
        if (it.category === "Bebida") {
          const name = it.flavors[0]?.name || "Bebida";
          drinks[name] = (drinks[name] || 0) + qty;
          return;
        }

        totalPizzas += qty;
        if (it.size) {
          sizes[it.size] = (sizes[it.size] || 0) + qty;
        }

        it.flavors.forEach((f) => {
          flavors[f.name] = (flavors[f.name] || 0) + qty;
        });

        if (it.crust && it.crust.name) {
          crusts[it.crust.name] = (crusts[it.crust.name] || 0) + qty;
        }

        if (it.extras) {
          it.extras.forEach((e) => {
            extras[e.name] = (extras[e.name] || 0) + qty;
          });
        }

        if (it.removals) {
          it.removals.forEach((r) => {
            removals[r] = (removals[r] || 0) + qty;
          });
        }
      });
    });

    return {
      activeOrdersCount: activeOrders.length,
      totalPizzas,
      sizes,
      flavors: Object.entries(flavors).sort((a, b) => b[1] - a[1]),
      crusts: Object.entries(crusts).sort((a, b) => b[1] - a[1]),
      extras: Object.entries(extras).sort((a, b) => b[1] - a[1]),
      removals: Object.entries(removals).sort((a, b) => b[1] - a[1]),
      drinks: Object.entries(drinks).sort((a, b) => b[1] - a[1]),
    };
  }, [orders]);

  // Impressão do Fechamento de Caixa na Epson TM-T20
  const handlePrintClosingReport = async () => {
    const reportData: ClosingReportData = {
      generatedAt: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dateStr: new Date().toLocaleDateString("pt-BR"),
      totalSales: metrics.totalSales,
      orderCount: metrics.todayCount,
      averageTicket: metrics.averageTicket,
      paymentBreakdown: metrics.paymentBreakdown,
      deliveryCount: metrics.deliveryCount,
      takeawayCount: metrics.takeawayCount,
      totalDeliveryFees: metrics.totalDeliveryFees,
      cancelledCount: metrics.cancelledCount,
    };

    if (printMode === "webusb" && usbDevice) {
      try {
        await printClosingReportViaWebUsb(usbDevice, reportData);
        showToast("Fechamento de Caixa impresso na Epson TM-T20 via USB!");
        return;
      } catch (e) {
        console.error("Falha ao imprimir fechamento via USB:", e);
      }
    }
    printClosingReportViaBrowser(reportData);
    showToast("Relatório de Fechamento enviado para a impressora!");
  };

  // Filtragem e busca de pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (o.customer_phone && o.customer_phone.includes(search)) ||
        o.id.includes(search);

      if (!matchSearch) return false;

      // Filtro de aba (ativos vs histórico)
      const isActive =
        o.status === "pending" ||
        o.status === "preparing" ||
        o.status === "delivering";

      if (activeTab === "active" && !isActive) return false;
      if (activeTab === "completed" && isActive) return false;

      // Filtros rápidos adicionais
      if (filterType === "delivery" && o.delivery_type !== "delivery")
        return false;
      if (filterType === "takeaway" && o.delivery_type === "delivery")
        return false;

      if (filterType === "delayed") {
        const sla = getSlaInfo(o.created_at);
        if (sla.status !== "delayed") return false;
      }

      if (filterType === "notes") {
        const hasNotes = o.items.some(
          (it) => it.observation || (it.removals && it.removals.length > 0)
        );
        if (!hasNotes) return false;
      }

      return true;
    });
  }, [orders, activeTab, search, filterType, getSlaInfo]);

  // Pedidos separados por coluna para o modo Kanban
  const kanbanColumns = useMemo(() => {
    return {
      pending: filteredOrders.filter((o) => o.status === "pending"),
      preparing: filteredOrders.filter((o) => o.status === "preparing"),
      delivering: filteredOrders.filter((o) => o.status === "delivering"),
    };
  }, [filteredOrders]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-cream">
        <div className="w-full max-w-sm rounded-sm border border-yellow/20 bg-linear-to-b from-[#1c191a] to-[#121011] p-8 shadow-2xl text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-sm bg-yellow/15 text-yellow ring-1 ring-yellow/30">
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
              className="w-full text-center tracking-[0.4em] font-mono text-lg rounded-sm border border-white/10 bg-black/60 px-4 py-3 text-cream outline-none focus:border-yellow"
            />

            {pinError && (
              <p className="text-xs font-bold text-red-light">
                PIN incorreto. (PIN padrão: 1234)
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-sm bg-linear-to-r from-red-primary to-yellow py-3 text-xs font-bold text-black shadow-lg transition-all hover:brightness-110 active:scale-95 cursor-pointer"
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

  // Renderizador de Card de Pedido reutilizável
  const renderOrderCard = (order: DbOrder) => {
    const statusCfg = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
    const isDelivery = order.delivery_type === "delivery";
    const sla = getSlaInfo(order.created_at);
    const isDelayed = sla.status === "delayed" && order.status !== "completed";
    const timeFormatted = new Date(order.created_at).toLocaleTimeString(
      "pt-BR",
      { hour: "2-digit", minute: "2-digit" }
    );

    return (
      <div
        key={order.id}
        className={`flex flex-col justify-between rounded-sm border bg-linear-to-b from-[#1d1a1b] to-[#141213] p-4 shadow-xl transition-all ${
          isDelayed
            ? "border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50"
            : "border-white/10 hover:border-yellow/40"
        }`}
      >
        <div>
          {/* Card Header & SLA Timer */}
          <div className="flex items-start justify-between gap-2 border-b border-white/8 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-yellow">
                  #{order.id.slice(0, 6)}
                </span>
                <span className="text-[0.68rem] text-muted flex items-center gap-1">
                  <Clock className="size-3" />
                  {timeFormatted}
                </span>

                {/* SLA Timer Badge */}
                {order.status !== "completed" &&
                  order.status !== "cancelled" && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[0.6rem] font-bold ${sla.badgeBg}`}
                    >
                      {sla.label}
                    </span>
                  )}
              </div>
              <h3 className="font-display text-base font-bold text-cream mt-1">
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
              className={`inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 font-mono text-[0.62rem] font-bold shrink-0 ${statusCfg.bg} ${statusCfg.text}`}
            >
              <span>{statusCfg.icon}</span>
              <span className="hidden sm:inline">{statusCfg.label}</span>
            </span>
          </div>

          {/* Delivery or Takeaway */}
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-cream-dim">
            {isDelivery ? (
              <>
                <Bike className="size-3.5 text-yellow shrink-0" />
                <span className="truncate">
                  Entrega: {order.address || "Endereço"}
                  {order.bairro ? ` · ${order.bairro}` : ""}
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

          {/* Items List com Alertas Visuais Agressivos */}
          <div className="mt-3 space-y-2 border-t border-white/6 pt-3">
            {order.items.map((it, idx) => {
              const flavors = it.flavors.map((f) => f.name).join(" + ");
              return (
                <div
                  key={idx}
                  className="rounded-sm border border-white/6 bg-black/40 p-2.5 text-xs"
                >
                  <div className="flex justify-between font-bold text-cream">
                    <span>
                      {it.qty}x {flavors}
                    </span>
                    <span className="font-mono text-yellow">
                      R$ {formatPrice(it.price * it.qty)}
                    </span>
                  </div>

                  <div className="text-[0.68rem] text-muted mt-1 flex flex-wrap gap-x-2 gap-y-1">
                    <span>
                      Tam: <strong className="text-cream">{it.size}</strong>
                    </span>
                    {it.crust && (
                      <span className="text-yellow font-semibold">
                        🧀 {it.crust.name}
                      </span>
                    )}
                    {it.extras && it.extras.length > 0 && (
                      <span className="text-cream font-medium">
                        🥓 {it.extras.map((e) => e.name).join(", ")}
                      </span>
                    )}
                  </div>

                  {/* ALERTA VISUAL AGRESSIVO PARA REMOÇÕES */}
                  {it.removals && it.removals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {it.removals.map((r, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-sm bg-red-500/25 border border-red-500/50 px-2 py-0.5 text-[0.68rem] font-black uppercase tracking-wider text-red-300 shadow-sm"
                        >
                          <AlertTriangle className="size-3 text-red-400 shrink-0" />
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* OBSERVAÇÃO DO CLIENTE COM ALTO CONTRASTE */}
                  {it.observation && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-sm bg-amber-500/15 border border-amber-500/35 p-1.5 text-[0.7rem] text-amber-200">
                      <MessageSquare className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 uppercase font-black text-[0.62rem] tracking-wide block">
                          Obs do Cliente:
                        </strong>
                        <span>{it.observation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Actions Bottom */}
        <div className="mt-4 border-t border-white/8 pt-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">
              Pgto: <strong>{order.payment_method}</strong>
            </span>
            <span className="font-display text-base font-bold text-yellow">
              R$ {formatPrice(order.total)}
            </span>
          </div>

          {/* Workflow status advance buttons */}
          <div className="grid grid-cols-2 gap-2">
            {order.status === "pending" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus(order.id, "preparing")}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-sm bg-linear-to-r from-red-primary to-yellow py-2.5 text-xs font-bold text-black shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <Flame className="size-4" />
                Colocar no Forno (Iniciar)
              </button>
            )}

            {order.status === "preparing" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus(order.id, "delivering")}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-sm bg-linear-to-r from-blue-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <Bike className="size-4" />
                {isDelivery ? "Despachar Entrega" : "Pronto para Retirada"}
              </button>
            )}

            {order.status === "delivering" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus(order.id, "completed")}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-sm bg-linear-to-r from-emerald-600 to-green-500 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <CheckCircle className="size-4" />
                Concluir Pedido
              </button>
            )}

            {/* Imprimir Comanda TM-T20 */}
            <button
              type="button"
              onClick={() => executePrint(order)}
              className="flex items-center justify-center gap-1.5 rounded-sm border border-white/10 bg-white/4 py-2 text-xs font-bold text-cream-dim hover:text-cream hover:bg-white/10 cursor-pointer"
            >
              <Printer className="size-3.5 text-yellow" />
              Imprimir TM-T20
            </button>

            {/* Notificar WhatsApp */}
            <button
              type="button"
              onClick={() => handleNotifyWhatsApp(order)}
              className="flex items-center justify-center gap-1.5 rounded-sm border border-[#25d366]/30 bg-[#25d366]/10 py-2 text-xs font-bold text-[#25d366] hover:bg-[#25d366]/20 cursor-pointer"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp
            </button>

            {/* Cancelar Pedido (se ainda ativo) */}
            {order.status !== "completed" && order.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => setCancelModalOrder(order)}
                className="col-span-2 mt-0.5 text-center text-[0.68rem] text-muted hover:text-red-400 transition-colors cursor-pointer"
              >
                Cancelar este pedido...
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121011] text-cream pb-16">
      {/* Top Bar Principal */}
      <header className="sticky top-0 z-100 border-b border-yellow/25 bg-[#1a1415]/95 backdrop-blur-md px-3 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex size-9 items-center justify-center rounded-sm border border-white/10 bg-white/4 text-muted transition-colors hover:text-yellow hover:border-yellow"
              title="Voltar ao cardápio"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-bold italic text-cream">
                  Painel KDS & Balcão
                </h1>
                <span className="flex items-center gap-1 rounded-sm bg-emerald-500/20 px-2 py-0.5 font-mono text-[0.6rem] font-bold text-emerald-400 border border-emerald-500/30">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ao Vivo
                </span>
              </div>
              <span className="hidden sm:inline text-[0.68rem] text-muted">
                Don Luydd Pizzaria · Pedidos em tempo real
              </span>
            </div>
          </div>

          {/* Ações Rápidas do Cabeçalho */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Botão Resumo do Forno (Batching) */}
            <button
              type="button"
              onClick={() => setSummaryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-yellow/30 bg-yellow/10 hover:bg-yellow/20 text-yellow text-xs font-bold transition-all cursor-pointer"
              title="Ver fila consolidada de pizzas no forno"
            >
              <Flame className="size-3.5 text-yellow" />
              <span className="hidden md:inline">Resumo Forno</span>
              <span className="rounded-sm bg-yellow text-black px-1.5 py-0.2 font-mono text-[0.65rem] font-bold">
                {ovenSummary.totalPizzas}
              </span>
            </button>

            {/* Fechamento de Caixa */}
            <button
              type="button"
              onClick={() => setClosingModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-white/10 bg-white/4 hover:bg-white/10 text-cream text-xs font-bold transition-all cursor-pointer"
              title="Fechamento de Caixa do Turno"
            >
              <DollarSign className="size-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Caixa</span>
            </button>

            {/* Pausar Itens (Estoque) */}
            <button
              type="button"
              onClick={() => setStockModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-white/10 bg-white/4 hover:bg-white/10 text-cream text-xs font-bold transition-all cursor-pointer"
              title="Pausar ou reativar sabores do cardápio"
            >
              <Ban className="size-3.5 text-red-400" />
              <span className="hidden lg:inline">Estoque</span>
              {pausedItems.length > 0 && (
                <span className="rounded-sm bg-red-500 text-white px-1.5 text-[0.6rem] font-bold">
                  {pausedItems.length}
                </span>
              )}
            </button>

            {/* Som Ativar/Desativar */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex size-9 items-center justify-center rounded-sm border text-xs font-bold transition-all cursor-pointer ${
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
            </button>

            {/* Tela Cheia (Fullscreen) */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex size-9 items-center justify-center rounded-sm border border-white/10 bg-white/4 text-muted transition-colors hover:text-yellow cursor-pointer"
              title={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
            >
              {isFullscreen ? (
                <Minimize className="size-4" />
              ) : (
                <Maximize className="size-4" />
              )}
            </button>

            {/* Recarregar */}
            <button
              type="button"
              onClick={fetchOrders}
              className="flex size-9 items-center justify-center rounded-sm border border-white/10 bg-white/4 text-muted transition-colors hover:text-cream cursor-pointer"
              title="Atualizar lista"
            >
              <RotateCw className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
        {/* Barra de Controle de Impressão Epson TM-T20 */}
        <div className="mb-5 rounded-sm border border-yellow/20 bg-linear-to-r from-[#1f1a1a] via-[#171415] to-[#121011] p-3.5 sm:p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-sm bg-yellow/15 text-yellow ring-1 ring-yellow/30 shrink-0">
              <Printer className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-cream">
                  Impressão Automática · Epson TM-T20 (80mm)
                </span>
                <span
                  className={`inline-block size-2 rounded-sm ${
                    autoPrint
                      ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                      : "bg-muted/40"
                  }`}
                />
              </div>
              <p className="text-[0.7rem] text-muted">
                {autoPrint
                  ? "Novos pedidos disparam impressão na comanda térmica imediatamente"
                  : "Impressão manual selecionada (clique em Imprimir no pedido)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Switch Auto-Print */}
            <button
              type="button"
              onClick={handleToggleAutoPrint}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                autoPrint
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/5 text-muted border border-white/10"
              }`}
            >
              <span>
                {autoPrint ? "Auto-Print Ativo" : "Auto-Print Desligado"}
              </span>
            </button>

            {/* Seletor Kiosk vs WebUSB */}
            <div className="flex items-center gap-1 rounded-sm bg-black/60 p-1 border border-white/8 text-xs">
              <button
                type="button"
                onClick={() => handleSetPrintMode("browser")}
                className={`px-2.5 py-1 rounded-sm font-bold transition-all cursor-pointer ${
                  printMode === "browser"
                    ? "bg-yellow text-black shadow-sm"
                    : "text-muted hover:text-cream"
                }`}
                title="Modo Fila do Sistema (--kiosk-printing)"
              >
                Kiosk
              </button>
              <button
                type="button"
                onClick={() => handleSetPrintMode("webusb")}
                className={`px-2.5 py-1 rounded-sm font-bold transition-all cursor-pointer ${
                  printMode === "webusb"
                    ? "bg-yellow text-black shadow-sm"
                    : "text-muted hover:text-cream"
                }`}
                title="Comunicação direta via cabo USB com comandos ESC/POS"
              >
                WebUSB
              </button>
            </div>

            {printMode === "webusb" && (
              <button
                type="button"
                onClick={handleConnectUsb}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-yellow/40 bg-yellow/15 hover:bg-yellow/25 text-yellow text-xs font-bold transition-all cursor-pointer"
              >
                <Usb className="size-3.5" />
                {usbDeviceName ? `USB Conectada` : "Conectar USB"}
              </button>
            )}

            <button
              type="button"
              onClick={handleTestPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-white/10 bg-white/4 hover:bg-white/10 text-cream text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="size-3.5 text-yellow" />
              Teste TM-T20
            </button>
          </div>
        </div>

        {/* Métricas do Turno */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="rounded-sm border border-white/8 bg-linear-to-b from-[#1c191a] to-[#141213] p-3 sm:p-4">
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-widest text-muted">
              Faturamento Hoje
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-xl sm:text-2xl font-bold text-yellow">
                R$ {formatPrice(metrics.totalSales)}
              </span>
            </div>
            <span className="text-[0.62rem] text-muted">
              {metrics.todayCount} pedidos hoje
            </span>
          </div>

          <div className="rounded-sm border border-yellow/30 bg-yellow/10 p-3 sm:p-4">
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-widest text-yellow">
              Em Produção
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-xl sm:text-2xl font-bold text-yellow">
                {metrics.activeCount}
              </span>
              <span className="text-[0.68rem] text-cream">pedidos</span>
            </div>
            <span className="text-[0.62rem] text-muted">
              {ovenSummary.totalPizzas} pizzas no total
            </span>
          </div>

          <div className="rounded-sm border border-white/8 bg-linear-to-b from-[#1c191a] to-[#141213] p-3 sm:p-4">
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-widest text-muted">
              Ticket Médio
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-xl sm:text-2xl font-bold text-cream">
                R$ {formatPrice(metrics.averageTicket)}
              </span>
            </div>
            <span className="text-[0.62rem] text-muted">por pedido hoje</span>
          </div>

          <div className="rounded-sm border border-white/8 bg-linear-to-b from-[#1c191a] to-[#141213] p-3 sm:p-4">
            <span className="font-mono text-[0.62rem] font-bold uppercase tracking-widest text-muted">
              Tempo Médio SLA
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-xl sm:text-2xl font-bold text-emerald-400">
                25~35 min
              </span>
            </div>
            <span className="text-[0.62rem] text-muted">meta da cozinha</span>
          </div>
        </div>

        {/* Barra de Filtros, Visualizações e Busca */}
        <div className="mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
            {/* Tabs Ativos vs Histórico */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "completed"
                    ? "bg-yellow text-black shadow-md"
                    : "bg-white/4 text-muted hover:text-cream"
                }`}
              >
                Histórico / Concluídos
              </button>
            </div>

            {/* Alternador Kanban vs Grade & Busca */}
            <div className="flex items-center gap-2">
              {activeTab === "active" && (
                <div className="flex items-center gap-1 rounded-sm bg-black/60 p-1 border border-white/8">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-yellow text-black"
                        : "text-muted hover:text-cream"
                    }`}
                    title="Visão por Grade de Comandas"
                  >
                    <LayoutGrid className="size-3.5" />
                    <span>Grade</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("kanban")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                      viewMode === "kanban"
                        ? "bg-yellow text-black"
                        : "text-muted hover:text-cream"
                    }`}
                    title="Visão por Colunas Kanban"
                  >
                    <Columns3 className="size-3.5" />
                    <span>Kanban</span>
                  </button>
                </div>
              )}

              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente ou ID..."
                  className="w-full rounded-sm border border-white/10 bg-black/60 pl-8 pr-3 py-1.5 text-xs text-cream outline-none focus:border-yellow"
                />
              </div>
            </div>
          </div>

          {/* Chips de Filtro Rápido */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[0.68rem] font-bold text-muted uppercase tracking-wider shrink-0 mr-1">
              Filtrar:
            </span>
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-sm font-bold transition-all shrink-0 cursor-pointer ${
                filterType === "all"
                  ? "bg-yellow text-black"
                  : "bg-white/4 text-muted hover:text-cream"
              }`}
            >
              Todos ({filteredOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("delivery")}
              className={`flex items-center gap-1 px-3 py-1 rounded-sm font-bold transition-all shrink-0 cursor-pointer ${
                filterType === "delivery"
                  ? "bg-blue-500 text-white"
                  : "bg-white/4 text-muted hover:text-cream"
              }`}
            >
              <Bike className="size-3" />
              Delivery
            </button>
            <button
              type="button"
              onClick={() => setFilterType("takeaway")}
              className={`flex items-center gap-1 px-3 py-1 rounded-sm font-bold transition-all shrink-0 cursor-pointer ${
                filterType === "takeaway"
                  ? "bg-yellow text-black"
                  : "bg-white/4 text-muted hover:text-cream"
              }`}
            >
              <Store className="size-3" />
              Balcão
            </button>
            <button
              type="button"
              onClick={() => setFilterType("delayed")}
              className={`flex items-center gap-1 px-3 py-1 rounded-sm font-bold transition-all shrink-0 cursor-pointer ${
                filterType === "delayed"
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-white/4 text-muted hover:text-red-400"
              }`}
            >
              <AlertTriangle className="size-3" />
              Atrasados (&gt; 30 min)
            </button>
            <button
              type="button"
              onClick={() => setFilterType("notes")}
              className={`flex items-center gap-1 px-3 py-1 rounded-sm font-bold transition-all shrink-0 cursor-pointer ${
                filterType === "notes"
                  ? "bg-amber-500 text-black"
                  : "bg-white/4 text-muted hover:text-amber-300"
              }`}
            >
              <MessageSquare className="size-3" />
              Com Observações / Sem Ingrediente
            </button>
          </div>
        </div>

        {/* Visualização dos Pedidos */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-yellow border-t-transparent" />
            <p className="mt-3 text-xs text-muted">Carregando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-sm border border-white/8 bg-white/2">
            <Receipt className="size-12 text-muted/40 mb-3" />
            <p className="font-display text-lg font-bold text-cream">
              {activeTab === "active"
                ? "Nenhum pedido em produção com os filtros aplicados"
                : "Nenhum pedido concluído encontrado"}
            </p>
            <p className="text-xs text-muted mt-1 max-w-sm">
              Assim que um cliente enviar um pedido pelo cardápio, ele surgirá
              aqui automaticamente e a comanda será impressa na Epson TM-T20.
            </p>
          </div>
        ) : activeTab === "active" && viewMode === "kanban" ? (
          /* MODO KANBAN EM 3 COLUNAS COM ROLAGEM HORIZONTAL SEGURO */
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start min-w-[760px] md:min-w-0">
              {/* Coluna 1: Novos / Pendentes */}
              <div className="rounded-sm border border-amber-500/20 bg-black/40 p-3">
                <div className="mb-3 flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔔</span>
                    <h3 className="font-display font-bold text-amber-300 text-sm">
                      Novos / A Fazer
                    </h3>
                  </div>
                  <span className="rounded-sm bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                    {kanbanColumns.pending.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {kanbanColumns.pending.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted/60">
                      Nenhum pedido novo pendente.
                    </p>
                  ) : (
                    kanbanColumns.pending.map(renderOrderCard)
                  )}
                </div>
              </div>

              {/* Coluna 2: No Forno / Em Preparo */}
              <div className="rounded-sm border border-red-500/20 bg-black/40 p-3">
                <div className="mb-3 flex items-center justify-between border-b border-red-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔥</span>
                    <h3 className="font-display font-bold text-red-400 text-sm">
                      No Forno / Preparando
                    </h3>
                  </div>
                  <span className="rounded-sm bg-red-500/20 px-2 py-0.5 font-mono text-xs font-bold text-red-300">
                    {kanbanColumns.preparing.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {kanbanColumns.preparing.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted/60">
                      Nenhum pedido no forno.
                    </p>
                  ) : (
                    kanbanColumns.preparing.map(renderOrderCard)
                  )}
                </div>
              </div>

              {/* Coluna 3: A Caminho / Pronto para Retirada */}
              <div className="rounded-sm border border-blue-500/20 bg-black/40 p-3">
                <div className="mb-3 flex items-center justify-between border-b border-blue-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛵</span>
                    <h3 className="font-display font-bold text-blue-400 text-sm">
                      A Caminho / Balcão
                    </h3>
                  </div>
                  <span className="rounded-sm bg-blue-500/20 px-2 py-0.5 font-mono text-xs font-bold text-blue-300">
                    {kanbanColumns.delivering.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {kanbanColumns.delivering.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted/60">
                      Nenhum pedido despachado.
                    </p>
                  ) : (
                    kanbanColumns.delivering.map(renderOrderCard)
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* MODO GRADE NORMAL */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(renderOrderCard)}
          </div>
        )}
      </main>

      {/* MODAL 1: RESUMO DO FORNO (MISE EN PLACE / BATCHING) */}
      {summaryOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm border border-yellow/30 bg-linear-to-b from-[#1f1b1c] to-[#121011] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSummaryOpen(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-sm bg-white/5 text-muted hover:text-cream cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-yellow mb-1">
              <Flame className="size-5" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                Fila de Produção Coletiva
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-cream">
              Resumo do Forno & Mise en Place
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Total acumulado de tudo o que precisa ser aberto, recheado e
              assado agora.
            </p>

            <div className="mt-6 space-y-5">
              {/* Tamanhos de Pizzas */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  Massas a Abrir por Tamanho
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ovenSummary.sizes).length === 0 ? (
                    <span className="text-xs text-muted">
                      Nenhuma pizza na fila.
                    </span>
                  ) : (
                    Object.entries(ovenSummary.sizes).map(([sz, qty]) => (
                      <div
                        key={sz}
                        className="flex items-center gap-2 rounded-sm border border-yellow/30 bg-yellow/10 px-3 py-2 text-sm font-bold text-yellow"
                      >
                        <span>Tamanho {sz}:</span>
                        <span className="rounded-sm bg-yellow text-black px-2 py-0.5 font-mono text-xs">
                          {qty}x
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sabores Mais Pedidos */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  Sabores na Fila ({ovenSummary.flavors.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ovenSummary.flavors.map(([name, qty]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between rounded-sm border border-white/6 bg-white/2 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-cream">{name}</span>
                      <span className="font-mono font-bold text-yellow bg-yellow/15 px-2 py-0.5 rounded-sm">
                        {qty}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bordas Especiais */}
              {ovenSummary.crusts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                    Bordas Recheadas a Preparar
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {ovenSummary.crusts.map(([crust, qty]) => (
                      <span
                        key={crust}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300"
                      >
                        <span>🧀 {crust}</span>
                        <span className="font-mono text-cream bg-black/40 px-1.5 py-0.2 rounded-sm">
                          {qty}x
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas e Remoções */}
              {ovenSummary.removals.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">
                    ⚠️ Atenção: Remoções Solicitadas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {ovenSummary.removals.map(([rem, qty]) => (
                      <span
                        key={rem}
                        className="inline-flex items-center gap-1 rounded-sm border border-red-500/40 bg-red-500/20 px-3 py-1 text-xs font-black uppercase text-red-300"
                      >
                        <span>❌ {rem}</span>
                        <span className="font-mono bg-red-600 text-white px-1.5 py-0.2 rounded-sm">
                          {qty}x
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bebidas */}
              {ovenSummary.drinks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                    Bebidas a Separar / Gelar
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {ovenSummary.drinks.map(([drk, qty]) => (
                      <span
                        key={drk}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300"
                      >
                        <span>🥤 {drk}</span>
                        <span className="font-mono text-cream bg-black/40 px-1.5 py-0.2 rounded-sm">
                          {qty}x
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-white/8 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="px-5 py-2 rounded-sm bg-white/10 text-xs font-bold text-cream hover:bg-white/20 cursor-pointer"
              >
                Fechar Resumo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FECHAMENTO DE CAIXA / RELATÓRIO DO TURNO */}
      {closingModalOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-lg rounded-sm border border-yellow/30 bg-linear-to-b from-[#1f1b1c] to-[#121011] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setClosingModalOpen(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-sm bg-white/5 text-muted hover:text-cream cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-yellow mb-1">
              <DollarSign className="size-5" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                Gestão Financeira
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-cream">
              Fechamento de Caixa / Turno
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Resumo contábil das vendas de hoje para conferência do caixa.
            </p>

            <div className="mt-5 space-y-4 rounded-sm border border-white/8 bg-black/50 p-4 text-xs">
              <div className="flex justify-between items-baseline border-b border-white/8 pb-2">
                <span className="text-muted">Faturamento Bruto:</span>
                <span className="font-display text-xl font-bold text-yellow">
                  R$ {formatPrice(metrics.totalSales)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted">Total de Pedidos Concluídos:</span>
                <span className="font-bold text-cream">
                  {metrics.todayCount}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted">Ticket Médio:</span>
                <span className="font-bold text-cream">
                  R$ {formatPrice(metrics.averageTicket)}
                </span>
              </div>

              <div className="border-t border-white/6 pt-2">
                <span className="font-bold text-cream-dim block mb-1.5 uppercase text-[0.65rem] tracking-wider">
                  Divisão por Forma de Pagamento:
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between text-muted">
                    <span>PIX ({metrics.paymentBreakdown.pix.count}x):</span>
                    <span className="font-mono text-cream font-bold">
                      R$ {formatPrice(metrics.paymentBreakdown.pix.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>
                      Cartão Débito/Crédito (
                      {metrics.paymentBreakdown.cartao.count}x):
                    </span>
                    <span className="font-mono text-cream font-bold">
                      R$ {formatPrice(metrics.paymentBreakdown.cartao.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>
                      Dinheiro em Espécie (
                      {metrics.paymentBreakdown.dinheiro.count}x):
                    </span>
                    <span className="font-mono text-cream font-bold">
                      R$ {formatPrice(metrics.paymentBreakdown.dinheiro.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/6 pt-2 flex justify-between text-muted">
                <span>Taxas de Entrega Arrecadadas:</span>
                <span className="font-mono text-cream">
                  R$ {formatPrice(metrics.totalDeliveryFees)} (
                  {metrics.deliveryCount} entregas)
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setClosingModalOpen(false)}
                className="px-4 py-2.5 rounded-sm border border-white/10 bg-white/4 text-xs font-bold text-muted hover:text-cream cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handlePrintClosingReport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-linear-to-r from-red-primary to-yellow text-xs font-bold text-black shadow-lg hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <Printer className="size-4" />
                Imprimir Relatório Z na Epson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PAUSAR SABORES & ESTOQUE */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm border border-yellow/30 bg-linear-to-b from-[#1f1b1c] to-[#121011] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setStockModalOpen(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-sm bg-white/5 text-muted hover:text-cream cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-yellow mb-1">
              <Ban className="size-5 text-red-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">
                Disponibilidade do Cardápio
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-cream">
              Pausar Itens e Ingredientes
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Se algum ingrediente acabou hoje, pause o sabor aqui para que os
              clientes não consigam pedir no cardápio online.
            </p>

            <div className="mt-5 space-y-6">
              {/* Pizzas Salgadas */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow mb-2.5">
                  Pizzas Salgadas (32 sabores)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {salgadas.map((p) => {
                    const isPaused = pausedItems.includes(p.name);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between rounded-sm border p-2.5 text-xs transition-all ${
                          isPaused
                            ? "border-red-500/40 bg-red-500/10 text-red-300"
                            : "border-white/6 bg-white/2 text-cream"
                        }`}
                      >
                        <span className="font-medium">{p.name}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleStockItem(p.name)}
                          className={`px-2.5 py-1 rounded-sm text-[0.65rem] font-bold cursor-pointer transition-all ${
                            isPaused
                              ? "bg-red-500 text-white"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          }`}
                        >
                          {isPaused ? "Esgotado (Pausado)" : "🟢 Disponível"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pizzas Doces */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow mb-2.5">
                  Pizzas Doces (6 sabores)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {doces.map((p) => {
                    const isPaused = pausedItems.includes(p.name);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between rounded-sm border p-2.5 text-xs transition-all ${
                          isPaused
                            ? "border-red-500/40 bg-red-500/10 text-red-300"
                            : "border-white/6 bg-white/2 text-cream"
                        }`}
                      >
                        <span className="font-medium">{p.name}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleStockItem(p.name)}
                          className={`px-2.5 py-1 rounded-sm text-[0.65rem] font-bold cursor-pointer transition-all ${
                            isPaused
                              ? "bg-red-500 text-white"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          }`}
                        >
                          {isPaused ? "Esgotado (Pausado)" : "🟢 Disponível"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ingredientes Extras */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow mb-2.5">
                  Ingredientes Extras
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXTRA_INGREDIENTS.map((extra) => {
                    const isPaused = pausedItems.includes(extra.name);
                    return (
                      <div
                        key={extra.id}
                        className={`flex items-center justify-between rounded-sm border p-2.5 text-xs transition-all ${
                          isPaused
                            ? "border-red-500/40 bg-red-500/10 text-red-300"
                            : "border-white/6 bg-white/2 text-cream"
                        }`}
                      >
                        <span className="font-medium">{extra.name}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleStockItem(extra.name)}
                          className={`px-2.5 py-1 rounded-sm text-[0.65rem] font-bold cursor-pointer transition-all ${
                            isPaused
                              ? "bg-red-500 text-white"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          }`}
                        >
                          {isPaused ? "Esgotado" : "🟢 Disponível"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/8 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                className="px-5 py-2 rounded-sm bg-yellow text-xs font-bold text-black hover:brightness-110 cursor-pointer"
              >
                Concluir Ajustes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRMAR CANCELAMENTO */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-sm rounded-sm border border-red-500/30 bg-[#191516] p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-cream">
              Cancelar Pedido #{cancelModalOrder.id.slice(0, 6)}?
            </h3>
            <p className="text-xs text-muted mt-1">
              Cliente: <strong>{cancelModalOrder.customer_name}</strong>
            </p>

            <div className="mt-4">
              <label className="text-[0.68rem] text-muted block mb-1">
                Motivo do cancelamento (opcional):
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Cliente desistiu, fora da área..."
                className="w-full rounded-sm border border-white/10 bg-black/60 px-3 py-2 text-xs text-cream outline-none focus:border-red-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelModalOrder(null);
                  setCancelReason("");
                }}
                className="px-3.5 py-2 rounded-sm border border-white/10 text-xs font-bold text-muted hover:text-cream cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-sm bg-red-600 text-xs font-bold text-white hover:bg-red-500 cursor-pointer"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
