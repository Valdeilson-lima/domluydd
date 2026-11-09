"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  storeMessage?: string | null;
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

export function CheckoutModal({
  open,
  cart,
  total,
  storeOpen,
  storeMessage,
  onClose,
  onOrderSent,
}: CheckoutModalProps) {
  const router = useRouter();
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bairroRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName("");
    setPhone("");
    setCep("");
    setAddress("");
    setComplement("");
    setBairro("");
    setPayment("PIX");
    setChangeAmount("");
    setBairroSearch("");
    setBairroOpen(false);
    setPixCopied(false);
    setDeliveryType("delivery");
    try {
      localStorage.removeItem("donluydd.customer.v1");
    } catch {
      /* ignore */
    }
  };

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

  const handleSend = async () => {
    if (!storeOpen || isSubmitting) return;
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

    setIsSubmitting(true);

    try {
      // 1. Envia o pedido para a API (Supabase / KDS Cozinha / Impressão Automática)
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: phone.trim() || null,
          delivery_type: deliveryType,
          cep: cep.trim() || null,
          address: address.trim() || null,
          complement: complement.trim() || null,
          bairro: bairro || null,
          items: cart,
          subtotal: total,
          delivery_fee: frete,
          total: totalComFrete,
          payment_method: payment,
          change_for: changeValue?.num || null,
        }),
      });

      const data = await res.json();
      const orderId =
        data.orderId || data.order?.id || `donluydd-${Date.now().toString(36)}`;

      // 2. Salva no localStorage para persistência e fallback offline
      try {
        localStorage.removeItem("donluydd.customer.v1");
        localStorage.setItem(
          "donluydd.last_order.v1",
          JSON.stringify({
            id: orderId,
            date: new Date().toISOString(),
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            delivery_type: deliveryType,
            address: address.trim(),
            bairro,
            complement: complement.trim(),
            cep: cep.trim(),
            items: cart,
            subtotal: total,
            delivery_fee: frete,
            total: totalComFrete,
            payment_method: payment,
            change_for: changeValue?.num || null,
            status: "pending",
          })
        );
      } catch {
        /* ignore */
      }

      resetForm();
      onOrderSent();
      showToast("Pedido confirmado! Acompanhe seu pedido ao vivo...");

      // 3. Redireciona diretamente para a página de acompanhamento do pedido
      router.push(`/pedido/${orderId}`);
    } catch (err) {
      console.error("Erro ao enviar pedido:", err);
      showToast("Erro ao processar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
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
        className="fixed inset-0 z-451 flex items-center justify-center p-2 sm:p-5"
      >
        <div className="w-full max-w-lg max-h-[94dvh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-sm border border-yellow/20 bg-linear-to-b from-[#1c191a] to-[#121011] shadow-[0_24px_64px_rgba(0,0,0,0.85)] animate-[modalIn_0.3s_ease]">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-sm bg-yellow/15 text-yellow">
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
              className="flex size-8 cursor-pointer items-center justify-center rounded-sm border border-white/10 bg-white/4 text-muted transition-all duration-200 hover:border-yellow/50 hover:bg-yellow/15 hover:text-yellow active:scale-90"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5 overscroll-contain">
            {!storeOpen && (
              <div className="rounded-sm border border-red-primary/40 bg-red-primary/10 p-4 text-center">
                <p className="text-sm font-bold text-red-light">Loja fechada</p>
                <p className="mt-1 text-xs text-cream-dim">
                  {storeMessage ||
                    "Você pode montar o pedido, mas o envio pelo WhatsApp só será processado quando a pizzaria abrir."}
                </p>
              </div>
            )}

            {/* 1. Toggle: Entrega vs Retirada no Balcão */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-sm bg-black/60 border border-white/8">
              <button
                type="button"
                onClick={() => setDeliveryType("delivery")}
                className={`flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-bold transition-all cursor-pointer ${
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
                className={`flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-bold transition-all cursor-pointer ${
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
                    className="w-full rounded-sm border border-white/10 bg-black/60 px-3.5 py-2.5 text-base sm:text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="WhatsApp / Telefone"
                    className="w-full rounded-sm border border-white/10 bg-black/60 px-3.5 py-2.5 text-base sm:text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow"
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
                    placeholder="CEP (58000-000)"
                    className="w-32 sm:w-36 rounded-sm border border-white/10 bg-black/60 px-3 py-2 text-base sm:text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow shrink-0"
                  />
                  <button
                    type="button"
                    onClick={handleLookupCep}
                    disabled={cepLoading}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm border border-yellow/40 bg-yellow/15 hover:bg-yellow/25 text-yellow text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
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
                    className="flex w-full items-center justify-between rounded-sm border border-white/10 bg-black/60 px-3.5 py-2.5 text-xs text-cream outline-none focus:border-yellow cursor-pointer"
                  >
                    <span className={bairro ? "text-cream" : "text-muted"}>
                      {bairro
                        ? `${bairro} (+ R$ ${formatPrice(frete)} frete)`
                        : "Selecione seu Bairro *"}
                    </span>
                    <ChevronDown className="size-4 text-muted" />
                  </button>

                  {bairroOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-sm border border-yellow/20 bg-[#1c191a] p-2 shadow-2xl">
                      <input
                        ref={searchRef}
                        type="text"
                        value={bairroSearch}
                        onChange={(e) => setBairroSearch(e.target.value)}
                        placeholder="Buscar bairro..."
                        className="mb-2 w-full rounded-sm border border-white/10 bg-black/60 px-3 py-1.5 text-base sm:text-xs text-cream outline-none focus:border-yellow"
                      />
                      <ul className="space-y-1">
                        {bairrosFiltrados.map((b) => (
                          <li
                            key={b.nome}
                            onClick={() => {
                              setBairro(b.nome);
                              setBairroOpen(false);
                            }}
                            className="flex cursor-pointer items-center justify-between rounded-sm px-2.5 py-2 text-xs text-cream-dim transition-colors hover:bg-yellow/15 hover:text-cream"
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
                  className="w-full rounded-sm border border-white/10 bg-black/60 px-3.5 py-2.5 text-base sm:text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow"
                />

                {/* Complemento */}
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Complemento (Apto, Bloco, etc.)"
                  className="w-full rounded-sm border border-white/10 bg-black/60 px-3.5 py-2.5 text-base sm:text-xs text-cream placeholder:text-muted/60 outline-none focus:border-yellow"
                />
              </div>
            ) : (
              <div className="rounded-sm border border-yellow/30 bg-yellow/10 p-3.5 space-y-1.5">
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
                      className={`flex items-center gap-2.5 p-3 rounded-sm border text-left transition-all cursor-pointer ${
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
                <div className="rounded-sm border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Zap className="size-3.5" />
                      Chave PIX (Telefone)
                    </span>
                    <button
                      type="button"
                      onClick={copyPixKey}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[0.68rem] font-bold transition-all cursor-pointer"
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
                  <div className="font-mono text-sm font-bold text-cream tracking-wider bg-black/50 p-2 rounded-sm border border-white/5">
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
                <div className="rounded-sm border border-white/10 bg-black/40 p-3 space-y-1.5">
                  <label className="block text-[0.68rem] font-medium text-cream-dim">
                    Precisa de troco para quanto?
                  </label>
                  <input
                    type="text"
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(e.target.value)}
                    placeholder="Ex: 50 ou 100 (ou digite 0 para não precisa)"
                    className="w-full rounded-sm border border-white/10 bg-black/60 px-3 py-2 text-base sm:text-xs text-cream outline-none focus:border-yellow"
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
            <div className="rounded-sm border border-white/8 bg-white/2 p-3.5 space-y-2">
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
          <div className="shrink-0 border-t border-yellow/20 bg-linear-to-b from-[#1a1718] to-[#121011] p-3.5 sm:p-5 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
            <button
              onClick={handleSend}
              disabled={!canSend || !storeOpen || isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm bg-linear-to-r from-red-primary to-yellow px-5 py-4 font-body text-sm font-bold text-black shadow-[0_8px_24px_rgba(232,37,42,0.35)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin text-black" />
                  <span>Enviando Pedido...</span>
                </>
              ) : (
                <>
                  <span>Confirmar e Acompanhar Pedido</span>
                  <span className="font-mono font-bold">
                    · R$ {formatPrice(totalComFrete)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
