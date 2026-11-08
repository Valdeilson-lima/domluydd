"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  MapPin,
  ChevronDown,
  Search,
  Banknote,
  CreditCard,
  Landmark,
  Zap,
  Receipt,
  Copy,
  Check,
  Bike,
  Store,
  User,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { bairros } from "@/data/bairros";
import type { CartItem } from "@/types";
import { showToast } from "@/components/ui/toast-helpers";

interface CheckoutModalProps {
  open: boolean;
  cart: CartItem[];
  total: number;
  storeOpen: boolean;
  onClose: () => void;
  onOrderSent: () => void;
}

const PIX_KEY = "83993740352";
const PIX_KEY_FORMATTED = "(83) 99374-0352";

const PAYMENTS = [
  { id: "PIX", label: "PIX", icon: Zap },
  { id: "Dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "Crédito", label: "Crédito", icon: CreditCard },
  { id: "Débito", label: "Débito", icon: Landmark },
] as const;

const PAYMENT_LABELS: Record<string, string> = {
  Dinheiro: "Dinheiro (pagamento na entrega/retirada)",
  PIX: "PIX (transferência instantânea)",
  Crédito: "Cartão de Crédito (levar maquininha)",
  Débito: "Cartão de Débito (levar maquininha)",
};

export function CheckoutModal({
  open,
  cart,
  total,
  storeOpen,
  onClose,
  onOrderSent,
}: CheckoutModalProps) {
  const [deliveryType, setDeliveryType] = useState<"delivery" | "takeaway">(
    "delivery"
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [complement, setComplement] = useState("");
  const [bairro, setBairro] = useState("");
  const [payment, setPayment] = useState<string>("PIX");
  const [changeAmount, setChangeAmount] = useState("");
  const [bairroSearch, setBairroSearch] = useState("");
  const [bairroOpen, setBairroOpen] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const bairroRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Carrega dados salvos do cliente no primeiro acesso
  useEffect(() => {
    try {
      const raw = localStorage.getItem("donluydd.customer.v1");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        if (data.deliveryType) setDeliveryType(data.deliveryType);
        if (data.cep) setCep(data.cep);
        if (data.address) setAddress(data.address);
        if (data.complement) setComplement(data.complement);
        if (data.bairro) setBairro(data.bairro);
        if (data.payment) setPayment(data.payment);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!bairroOpen) return;
    searchRef.current?.focus();
    const handler = (e: MouseEvent) => {
      if (bairroRef.current && !bairroRef.current.contains(e.target as Node))
        setBairroOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [bairroOpen]);

  if (!open) return null;

  const handleLookupCep = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      showToast("Informe um CEP válido com 8 dígitos");
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) {
        showToast("CEP não encontrado");
      } else {
        if (data.logradouro) setAddress(data.logradouro);
        if (data.bairro) {
          const match = bairros.find(
            (b) => b.nome.toLowerCase() === data.bairro.toLowerCase()
          );
          if (match) {
            setBairro(match.nome);
          } else {
            const partial = bairros.find((b) =>
              b.nome.toLowerCase().includes(data.bairro.toLowerCase())
            );
            if (partial) setBairro(partial.nome);
          }
        }
        showToast("Endereço preenchido pelo CEP!");
      }
    } catch {
      showToast("Erro ao buscar CEP. Preencha manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  const copyPixKey = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(PIX_KEY);
      setPixCopied(true);
      showToast("Chave PIX copiada!");
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const bairrosFiltrados = bairros.filter(
    (b) =>
      !bairroSearch || b.nome.toLowerCase().includes(bairroSearch.toLowerCase())
  );

  const bairroSelecionado = bairros.find((b) => b.nome === bairro);
  const frete =
    deliveryType === "delivery" ? (bairroSelecionado?.frete ?? 0) : 0;
  const totalComFrete = total + frete;

  const changeValue = (() => {
    const clean = changeAmount.replace(",", ".").replace(/[^0-9.]/g, "");
    const num = parseFloat(clean);
    if (isNaN(num) || num <= 0) return null;
    return { num, change: num - totalComFrete };
  })();

  const canSend = Boolean(
    name.trim() && (deliveryType === "takeaway" || (bairro && address.trim()))
  );

  const buildWhatsAppMessage = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const line = "━━━━━━━━━━━━━━━━━━";
    const lineThin = "─────────────────";

    const itemsList = cart
      .map((item, i) => {
        const isHalf =
          item.flavors.length > 1 &&
          item.flavors[0].name !== item.flavors[1].name;
        const nameStr = isHalf
          ? `${item.flavors[0].name} + ${item.flavors[1].name}`
          : item.flavors[0].name;
        const qtyStr = item.qty > 1 ? `${item.qty}x ` : "";
        const lineTotal = item.price * item.qty;

        let details = `*${i + 1}.* ${qtyStr}${nameStr} _(${item.size})_\n     R$ ${formatPrice(lineTotal)}`;
        if (item.crust) {
          details += `\n     🧀 *Borda:* ${item.crust.name}`;
        }
        if (item.extras && item.extras.length > 0) {
          details += `\n     🥓 *Extras:* ${item.extras.map((e) => e.name).join(", ")}`;
        }
        if (item.removals && item.removals.length > 0) {
          details += `\n     ❌ *Sem:* ${item.removals.join(", ")}`;
        }
        if (item.observation) {
          details += `\n     📝 _Obs: ${item.observation}_`;
        }
        return details;
      })
      .join("\n\n");

    const paymentLabel = PAYMENT_LABELS[payment] ?? payment;
    const itemCount = cart.reduce((s, i) => s + i.qty, 0);

    let msg = "";
    msg += `🍕 *DON LUYDD PIZZARIA* 🍕`;
    msg += `\n${line}`;
    msg += `\n📄 *NOVO PEDIDO DIGITAL*`;
    msg += `\n📅 ${dateStr} às ${timeStr}`;
    msg += `\n🛒 ${itemCount} ${itemCount === 1 ? "item" : "itens"}`;
    msg += `\n${line}`;

    msg += `\n\n👤 *DADOS DO CLIENTE*`;
    msg += `\nNome: *${name.trim()}*`;
    if (phone.trim()) msg += `\nTelefone: ${phone.trim()}`;
    msg += `\nTipo: *${deliveryType === "delivery" ? "🛵 Entrega a Domicílio" : "🏬 Retirada no Balcão"}*`;

    if (deliveryType === "delivery") {
      const fullAddress = complement.trim()
        ? `${address.trim()} (Comp: ${complement.trim()})`
        : address.trim();
      msg += `\n\n📍 *ENDEREÇO DE ENTREGA*`;
      msg += `\n🏠 ${fullAddress}`;
      msg += `\n🗺️ Bairro: ${bairro}`;
      if (cep.trim()) msg += `\n📮 CEP: ${cep.trim()}`;
    } else {
      msg += `\n\n🏬 *RETIRADA NO BALCÃO*`;
      msg += `\nCliente irá retirar na pizzaria (Sem taxa de entrega).`;
    }

    msg += `\n\n${line}`;
    msg += `\n🍕 *ITENS DO PEDIDO*`;
    msg += `\n\n${itemsList}`;
    msg += `\n\n${line}`;

    msg += `\n💰 *RESUMO FINANCEIRO*`;
    msg += `\nSubtotal:     R$ ${formatPrice(total)}`;
    if (deliveryType === "delivery") {
      msg += `\nTaxa Entrega: R$ ${formatPrice(frete)} (${bairro})`;
    } else {
      msg += `\nTaxa Entrega: R$ 0,00 (Retirada no Balcão)`;
    }
    msg += `\n${lineThin}`;
    msg += `\n*TOTAL GERAL: R$ ${formatPrice(totalComFrete)}*`;
    msg += `\n${line}`;

    msg += `\n\n💳 *FORMA DE PAGAMENTO*`;
    msg += `\n${paymentLabel}`;

    if (payment === "PIX") {
      msg += `\n🔑 Chave Pix: ${PIX_KEY_FORMATTED}`;
      msg += `\n(Favor enviar o comprovante após a transferência)`;
    } else if (
      payment === "Dinheiro" &&
      changeValue &&
      changeValue.num > totalComFrete
    ) {
      msg += `\n💵 Troco para: R$ ${formatPrice(changeValue.num)}`;
      msg += `\n🪙 Valor do troco: R$ ${formatPrice(changeValue.change)}`;
    } else if (payment === "Dinheiro" && changeAmount === "0") {
      msg += `\n💵 Não precisa de troco (valor exato)`;
    }

    msg += `\n${line}`;
    msg += `\n✨ _Pedido gerado pelo Cardápio Don Luydd_`;

    return msg;
  };

  const handleSend = () => {
    if (!storeOpen) return;
    if (!name.trim()) {
      showToast("Informe seu nome para o pedido");
      return;
    }
    if (deliveryType === "delivery") {
      if (!bairro) {
        showToast("Selecione o bairro de entrega");
        return;
      }
      if (!address.trim()) {
        showToast("Informe o endereço de entrega");
        return;
      }
    }

    // Salva dados no localStorage para próximas compras
    try {
      localStorage.setItem(
        "donluydd.customer.v1",
        JSON.stringify({
          name,
          phone,
          deliveryType,
          cep,
          address,
          complement,
          bairro,
          payment,
        })
      );
      localStorage.setItem(
        "donluydd.last_order.v1",
        JSON.stringify({
          id: String(Date.now()),
          date: new Date().toISOString(),
          items: cart,
          total: totalComFrete,
          deliveryType,
        })
      );
    } catch {
      /* ignore */
    }

    // Salva no Supabase via API Route
    try {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          delivery_type: deliveryType,
          cep,
          address,
          complement,
          bairro,
          items: cart,
          subtotal: total,
          delivery_fee: frete,
          total: totalComFrete,
          payment_method: payment,
          change_for: changeValue?.num || null,
        }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }

    const msg = buildWhatsAppMessage();
    window.open(
      `https://wa.me/5583993740352?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
    setChangeAmount("");
    onOrderSent();
    showToast("Pedido enviado com sucesso para o WhatsApp!");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-450 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="fixed inset-0 z-451 flex items-center justify-center p-3 sm:p-5"
      >
        <div className="w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-yellow/20 bg-linear-to-b from-[#1c191a] to-[#121011] shadow-[0_24px_64px_rgba(0,0,0,0.85)] animate-[modalIn_0.3s_ease]">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-yellow/15 text-yellow">
                <Receipt className="size-5" />
              </div>
              <div>
                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-wider text-yellow">
                  Etapa Final
                </span>
                <h3
                  id="checkout-title"
                  className="font-display text-lg font-bold text-cream sm:text-xl"
                >
                  Finalizar Pedido
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/4 text-muted transition-all duration-200 hover:border-yellow/50 hover:bg-yellow/15 hover:text-yellow active:scale-90"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
            {!storeOpen && (
              <div className="rounded-xl border border-red-primary/40 bg-red-primary/10 p-4 text-center">
                <p className="text-sm font-bold text-red-light">Loja fechada</p>
                <p className="mt-1 text-xs text-cream-dim">
                  Você pode montar o pedido, mas o envio pelo WhatsApp só será
                  processado quando a pizzaria abrir.
                </p>
              </div>
            )}

            {/* 1. Toggle: Entrega vs Retirada no Balcão */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/60 border border-white/8">
              <button
                type="button"
                onClick={() => setDeliveryType("delivery")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deliveryType === "delivery"
                    ? "bg-yellow text-black shadow-md"
                    : "text-muted hover:text-cream"
                }`}
              >
                <Bike className="size-4" />
                Entrega (Delivery)
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("takeaway")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deliveryType === "takeaway"
                    ? "bg-yellow text-black shadow-md"
                    : "text-muted hover:text-cream"
                }`}
              >
                <Store className="size-4" />
                Retirada no Balcão
              </button>
            </div>

            {/* 2. Dados do Cliente */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                <User className="size-3 text-muted" />
                Seus Dados
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo *"
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="WhatsApp / Telefone"
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow"
                  />
                </div>
              </div>
            </div>

            {/* 3. Seção de Endereço (ou Info de Retirada) */}
            {deliveryType === "delivery" ? (
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                  <MapPin className="size-3 text-muted" />
                  Endereço para Entrega
                </label>

                {/* CEP com Busca Automática */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cep}
                    maxLength={9}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="CEP (ex: 58000-000)"
                    className="w-36 rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow"
                  />
                  <button
                    type="button"
                    onClick={handleLookupCep}
                    disabled={cepLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-yellow/40 bg-yellow/15 hover:bg-yellow/25 text-yellow text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {cepLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Search className="size-3.5" />
                    )}
                    Buscar CEP
                  </button>
                </div>

                {/* Bairro Dropdown */}
                <div ref={bairroRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setBairroOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-cream outline-none focus:border-yellow cursor-pointer"
                  >
                    <span className={bairro ? "text-cream" : "text-muted"}>
                      {bairro
                        ? `${bairro} (+ R$ ${formatPrice(frete)} frete)`
                        : "Selecione seu Bairro *"}
                    </span>
                    <ChevronDown className="size-4 text-muted" />
                  </button>

                  {bairroOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-yellow/20 bg-[#1c191a] p-2 shadow-2xl">
                      <input
                        ref={searchRef}
                        type="text"
                        value={bairroSearch}
                        onChange={(e) => setBairroSearch(e.target.value)}
                        placeholder="Buscar bairro..."
                        className="mb-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-cream outline-none focus:border-yellow"
                      />
                      <ul className="space-y-1">
                        {bairrosFiltrados.map((b) => (
                          <li
                            key={b.nome}
                            onClick={() => {
                              setBairro(b.nome);
                              setBairroOpen(false);
                            }}
                            className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs text-cream-dim transition-colors hover:bg-yellow/15 hover:text-cream"
                          >
                            <span>{b.nome}</span>
                            <span className="font-mono text-yellow">
                              R$ {formatPrice(b.frete)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Rua e Número */}
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua / Avenida e Número *"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow"
                />

                {/* Complemento */}
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Complemento / Ponto de referência (Apto, Bloco, etc.)"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-yellow/30 bg-yellow/10 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-yellow font-bold text-xs">
                  <Store className="size-4" />
                  Retirada no Balcão (Frete Grátis)
                </div>
                <p className="text-xs text-cream-dim leading-relaxed">
                  Endereço: <strong>Av. Epitácio Pessoa, 1200 - Centro</strong>
                </p>
                <p className="text-[0.68rem] text-muted">
                  Tempo estimado de preparo: <strong>25 a 35 minutos</strong>.
                  Avisaremos pelo WhatsApp assim que estiver pronto para
                  retirar!
                </p>
              </div>
            )}

            {/* 4. Forma de Pagamento */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                <Banknote className="size-3 text-muted" />
                Forma de Pagamento
              </label>

              <div className="grid grid-cols-2 gap-2">
                {PAYMENTS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = payment === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPayment(p.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-yellow bg-yellow/15 text-yellow shadow-sm"
                          : "border-white/8 bg-white/2 text-cream hover:border-white/20"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="text-xs font-bold">{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Box especial do PIX com chave Copia e Cola */}
              {payment === "PIX" && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Zap className="size-3.5" />
                      Chave PIX (Telefone)
                    </span>
                    <button
                      type="button"
                      onClick={copyPixKey}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[0.68rem] font-bold transition-all cursor-pointer"
                    >
                      {pixCopied ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          Copiar Chave
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-sm font-bold text-cream tracking-wider bg-black/50 p-2 rounded-lg border border-white/5">
                    {PIX_KEY_FORMATTED}
                  </div>
                  <p className="text-[0.65rem] text-muted leading-tight">
                    Você pode copiar a chave agora para agilizar o pagamento.
                    Basta enviar o comprovante no WhatsApp ao finalizar o
                    pedido.
                  </p>
                </div>
              )}

              {/* Campo de Troco para Dinheiro */}
              {payment === "Dinheiro" && (
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1.5">
                  <label className="block text-[0.68rem] font-medium text-cream-dim">
                    Precisa de troco para quanto?
                  </label>
                  <input
                    type="text"
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(e.target.value)}
                    placeholder="Ex: 50 ou 100 (ou digite 0 para não precisa)"
                    className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-cream outline-none focus:border-yellow"
                  />
                  {changeValue && changeValue.change > 0 && (
                    <p className="text-[0.68rem] text-yellow font-mono">
                      Troco a devolver: R$ {formatPrice(changeValue.change)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            <div className="rounded-xl border border-white/8 bg-white/2 p-3.5 space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Subtotal dos itens ({cart.length})</span>
                <span className="font-mono text-cream">
                  R$ {formatPrice(total)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Taxa de entrega</span>
                <span className="font-mono text-yellow font-medium">
                  {deliveryType === "takeaway"
                    ? "Grátis (Retirada)"
                    : frete > 0
                      ? `R$ ${formatPrice(frete)}`
                      : "Selecione o bairro"}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/6 pt-2 font-bold">
                <span className="text-sm text-cream">Total Geral</span>
                <span className="font-display text-xl text-yellow">
                  R$ {formatPrice(totalComFrete)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="shrink-0 border-t border-yellow/20 bg-linear-to-b from-[#1a1718] to-[#121011] p-4 sm:p-5">
            <button
              onClick={handleSend}
              disabled={!canSend || !storeOpen}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#25d366] to-[#128c7e] px-5 py-4 font-body text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Enviar Pedido pelo WhatsApp</span>
              <span className="font-mono font-bold">
                · R$ {formatPrice(totalComFrete)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
