import { useState, useRef, useEffect } from "react";
import {
  X,
  MapPin,
  Wine,
  ChevronDown,
  Search,
  Banknote,
  CreditCard,
  Landmark,
  Zap,
  Receipt,
  Sparkles,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { CartItem, Drink } from "@/types";
import { bairros } from "@/data/bairros";
import { bebidas } from "@/data/drinks";
import { showToast } from "@/components/ui/toast-helpers";

interface CheckoutModalProps {
  open: boolean;
  cart: CartItem[];
  total: number;
  storeOpen: boolean;
  onAddDrink: (drink: Drink) => void;
  onClose: () => void;
  onOrderSent: () => void;
}

const PAYMENTS = [
  { id: "Dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "PIX", label: "PIX", icon: Zap },
  { id: "Crédito", label: "Crédito", icon: CreditCard },
  { id: "Débito", label: "Débito", icon: Landmark },
] as const;

const PAYMENT_LABELS: Record<string, string> = {
  Dinheiro: "Dinheiro",
  PIX: "PIX",
  Crédito: "Cartão de crédito",
  Débito: "Cartão de débito",
};

export function CheckoutModal({
  open,
  cart,
  total,
  storeOpen,
  onAddDrink,
  onClose,
  onOrderSent,
}: CheckoutModalProps) {
  const [address, setAddress] = useState("");
  const [complement, setComplement] = useState("");
  const [bairro, setBairro] = useState("");
  const [payment, setPayment] = useState<string>("PIX");
  const [changeAmount, setChangeAmount] = useState("");
  const [showDrinks, setShowDrinks] = useState(false);
  const [bairroSearch, setBairroSearch] = useState("");
  const [bairroOpen, setBairroOpen] = useState(false);
  const bairroRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Reseta estado ao abrir
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBairroSearch("");
      setBairroOpen(false);
    }
  }

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

  const bairrosFiltrados = bairros.filter(
    (b) =>
      !bairroSearch || b.nome.toLowerCase().includes(bairroSearch.toLowerCase())
  );

  if (!open) return null;

  const bairroSelecionado = bairros.find((b) => b.nome === bairro);
  const frete = bairroSelecionado?.frete ?? 0;
  const totalComFrete = total + frete;

  const changeValue = (() => {
    const clean = changeAmount.replace(",", ".").replace(/[^0-9.]/g, "");
    const num = parseFloat(clean);
    if (isNaN(num) || num <= 0) return null;
    return { num, change: num - totalComFrete };
  })();

  const canSend = Boolean(bairro && address.trim());

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
        const name = isHalf
          ? `${item.flavors[0].name} + ${item.flavors[1].name}`
          : item.flavors[0].name;
        const qtyStr = item.qty > 1 ? `${item.qty}x ` : "";
        const lineTotal = item.price * item.qty;
        const obsStr = item.observation
          ? `\n     _Obs: ${item.observation}_`
          : "";
        return `*${i + 1}.* ${qtyStr}${name} _(${item.size})_\n     R$ ${formatPrice(lineTotal)}${obsStr}`;
      })
      .join("\n\n");

    const paymentLabel = PAYMENT_LABELS[payment] ?? payment;
    const itemCount = cart.reduce((s, i) => s + i.qty, 0);

    const fullAddress = complement.trim()
      ? `${address.trim()} (Comp: ${complement.trim()})`
      : address.trim();

    let msg = "";
    msg += `🍕 *DON LUYDD PIZZARIA* 🍕`;
    msg += `\n${line}`;
    msg += `\n📄 *NOVO PEDIDO DIGITAL*`;
    msg += `\n📅 ${dateStr} às ${timeStr}`;
    msg += `\n🛒 ${itemCount} ${itemCount === 1 ? "item" : "itens"}`;
    msg += `\n${line}`;
    msg += `\n\n🍕 *ITENS DO PEDIDO*`;
    msg += `\n\n${itemsList}`;
    msg += `\n\n${line}`;
    msg += `\n💰 *RESUMO FINANCEIRO*`;
    msg += `\nSubtotal:    R$ ${formatPrice(total)}`;
    if (frete > 0) {
      msg += `\nTaxa Entrega: R$ ${formatPrice(frete)} (${bairro})`;
    }
    msg += `\n${lineThin}`;
    msg += `\n*TOTAL GERAL: R$ ${formatPrice(totalComFrete)}*`;
    msg += `\n${line}`;
    msg += `\n\n📍 *ENDEREÇO DE ENTREGA*`;
    msg += `\n🏠 ${fullAddress}`;
    msg += `\n🗺️ Bairro: ${bairro}`;
    msg += `\n${line}`;
    msg += `\n\n💳 *FORMA DE PAGAMENTO*`;
    msg += `\n${paymentLabel}`;

    if (
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
    if (!bairro) {
      showToast("Selecione o bairro de entrega");
      return;
    }
    if (!address.trim()) {
      showToast("Informe o endereço de entrega");
      return;
    }

    const msg = buildWhatsAppMessage();
    window.open(
      `https://wa.me/5583993740352?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
    setChangeAmount("");
    onOrderSent();
    showToast("Pedido enviado com sucesso");
  };

  return (
    <>
      {/* Backdrop */}
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
                  Confirmar e Enviar Pedido
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
                <p className="mt-0.5 text-xs text-cream-dim">
                  Horário de atendimento: Terça a Domingo, das 18h às 22h.
                </p>
              </div>
            )}

            {/* 1. Comanda / Resumo do Pedido */}
            <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-white/6 pb-2">
                <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                  Resumo da Comanda
                </span>
                <span className="font-mono text-xs text-muted">
                  {cart.length} {cart.length === 1 ? "item" : "itens"}
                </span>
              </div>

              <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const isHalf =
                    item.flavors.length > 1 &&
                    item.flavors[0].name !== item.flavors[1].name;
                  const name = isHalf
                    ? `${item.flavors[0].name} + ${item.flavors[1].name}`
                    : item.flavors[0].name;

                  return (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-cream font-medium">
                          <span className="font-mono text-yellow font-bold">
                            {item.qty}x{" "}
                          </span>
                          {name}
                        </span>
                        <span className="text-muted text-[0.68rem] block">
                          Tamanho {item.size}
                          {item.observation && ` · Obs: "${item.observation}"`}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono font-semibold text-yellow">
                        R$ {formatPrice(item.price * item.qty)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Totais */}
              <div className="border-t border-white/6 pt-2 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Subtotal</span>
                  <span className="font-mono text-cream-dim">
                    R$ {formatPrice(total)}
                  </span>
                </div>
                {bairro ? (
                  <div className="flex items-center justify-between text-xs text-yellow">
                    <span>Taxa de Entrega ({bairro})</span>
                    <span className="font-mono font-bold">
                      R$ {formatPrice(frete)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-muted/70">
                    <span>Taxa de Entrega</span>
                    <span className="text-[0.68rem] italic">
                      Selecione o bairro abaixo
                    </span>
                  </div>
                )}
                <div className="flex items-end justify-between border-t border-white/6 pt-2">
                  <span className="font-body text-sm font-bold text-cream">
                    Total do Pedido
                  </span>
                  <span className="font-display text-xl font-bold text-yellow">
                    R$ {formatPrice(totalComFrete)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Endereço e Bairro de Entrega */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                <MapPin className="size-3.5 text-yellow" />
                Local de Entrega
              </label>

              {/* Bairro Selector Dropdown */}
              <div ref={bairroRef} className="relative">
                <button
                  type="button"
                  onClick={() => setBairroOpen((v) => !v)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-all duration-200 ${
                    bairro
                      ? "border-yellow/50 bg-black/60 text-cream"
                      : "border-white/10 bg-black/40 text-muted/80 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin className="size-4 shrink-0 text-yellow" />
                    <span className="truncate">
                      {bairro || "Selecione seu bairro..."}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {bairro && (
                      <span className="rounded-md bg-yellow/15 px-2 py-0.5 font-mono text-xs font-bold text-yellow">
                        Taxa: R$ {formatPrice(frete)}
                      </span>
                    )}
                    <ChevronDown
                      className={`size-4 text-muted transition-transform duration-200 ${
                        bairroOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {bairroOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border border-yellow/30 bg-[#1c191a] shadow-2xl overflow-hidden animate-[fadeUp_0.15s_ease]">
                    <div className="flex items-center gap-2 border-b border-white/8 bg-black/40 px-3 py-2">
                      <Search className="size-4 shrink-0 text-muted" />
                      <input
                        ref={searchRef}
                        type="text"
                        value={bairroSearch}
                        onChange={(e) => setBairroSearch(e.target.value)}
                        placeholder="Buscar bairro..."
                        className="w-full bg-transparent py-1 font-body text-xs text-cream outline-none placeholder:text-muted/60"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {bairrosFiltrados.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs text-muted">
                          Bairro não encontrado
                        </p>
                      ) : (
                        bairrosFiltrados.map((b) => {
                          const selected = bairro === b.nome;
                          return (
                            <button
                              key={b.nome}
                              type="button"
                              onClick={() => {
                                setBairro(b.nome);
                                setBairroOpen(false);
                                setBairroSearch("");
                              }}
                              className={`flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-yellow/10 ${
                                selected
                                  ? "bg-yellow/15 text-yellow font-bold"
                                  : "text-cream-dim"
                              }`}
                            >
                              <span>{b.nome}</span>
                              <span className="font-mono text-yellow">
                                R$ {formatPrice(b.frete)}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Street & Number */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua e número da residência (ex: Rua das Flores, 120)"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-3 font-body text-xs sm:text-sm text-cream outline-none transition-colors duration-200 placeholder:text-muted/60 focus:border-yellow/60"
                />
              </div>

              {/* Complemento / Ponto de Referência */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Complemento / Ponto de referência (ex: Apto 302, portão azul)"
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 font-body text-xs text-cream outline-none transition-colors duration-200 placeholder:text-muted/60 focus:border-yellow/60"
                />
              </div>
            </div>

            {/* 3. Forma de Pagamento */}
            <div className="space-y-2.5">
              <label className="block font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream-dim">
                Forma de Pagamento
              </label>

              <div className="grid grid-cols-2 gap-2">
                {PAYMENTS.map((opt) => {
                  const active = payment === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPayment(opt.id)}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-semibold transition-all duration-200 select-none ${
                        active
                          ? "border-yellow bg-yellow/15 text-cream shadow-[0_0_12px_rgba(242,183,5,0.2)]"
                          : "border-white/8 bg-white/2 text-cream-dim hover:border-white/20"
                      }`}
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                          active
                            ? "border-yellow bg-yellow text-black"
                            : "border-muted/50"
                        }`}
                      >
                        {active && (
                          <span className="size-1.5 rounded-full bg-black" />
                        )}
                      </span>
                      <Icon
                        className={`size-4 shrink-0 ${
                          active ? "text-yellow" : "text-muted"
                        }`}
                      />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Troco para dinheiro */}
              {payment === "Dinheiro" && (
                <div className="rounded-xl border border-white/8 bg-white/2 p-3 space-y-2 animate-[fadeUp_0.2s_ease]">
                  <label className="block font-mono text-[0.62rem] uppercase tracking-wider text-muted">
                    Precisa de troco?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={changeAmount}
                      onChange={(e) => setChangeAmount(e.target.value)}
                      placeholder="Valor para troco (ex: 50,00)"
                      inputMode="decimal"
                      className="flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs text-cream outline-none focus:border-yellow"
                    />
                    <button
                      type="button"
                      onClick={() => setChangeAmount("0")}
                      className={`rounded-lg border px-3 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer ${
                        changeAmount === "0"
                          ? "border-yellow bg-yellow/20 text-yellow"
                          : "border-white/10 bg-white/5 text-muted hover:text-cream"
                      }`}
                    >
                      Não preciso
                    </button>
                  </div>

                  {changeValue && changeValue.num >= totalComFrete && (
                    <p className="text-xs font-bold text-yellow flex items-center gap-1">
                      <Sparkles className="size-3" />
                      Troco calculado: R$ {formatPrice(changeValue.change)}
                    </p>
                  )}
                  {changeValue && changeValue.num < totalComFrete && (
                    <p className="text-xs font-bold text-red-light">
                      Valor menor que o total do pedido (R${" "}
                      {formatPrice(totalComFrete)})
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 4. Sugestão rápida de bebida se faltar */}
            {storeOpen && (
              <div className="rounded-xl border border-white/8 bg-white/2 p-3">
                <button
                  type="button"
                  onClick={() => setShowDrinks((v) => !v)}
                  className="flex w-full cursor-pointer items-center justify-between text-left text-xs font-bold text-cream"
                >
                  <div className="flex items-center gap-2">
                    <Wine className="size-4 text-yellow" />
                    <span>Deseja adicionar bebidas geladas?</span>
                  </div>
                  <ChevronDown
                    className={`size-4 text-muted transition-transform duration-200 ${
                      showDrinks ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showDrinks && (
                  <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-white/6 pt-2.5 animate-[fadeUp_0.2s_ease]">
                    {bebidas.map((drink) => (
                      <button
                        key={drink.name}
                        type="button"
                        onClick={() => onAddDrink(drink)}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-white/8 bg-white/3 p-2 text-left hover:border-yellow/40 hover:bg-yellow/10 transition-colors"
                      >
                        <span className="text-xs font-medium text-cream truncate">
                          {drink.name}
                        </span>
                        <span className="font-mono text-[0.68rem] text-yellow shrink-0">
                          +R$ {formatPrice(drink.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky CTA Footer */}
          <div className="shrink-0 border-t border-yellow/20 bg-linear-to-b from-[#1a1718] to-[#121011] p-4 sm:p-5 space-y-2">
            <button
              onClick={handleSend}
              disabled={!canSend || !storeOpen}
              className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-4 font-body text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition-all duration-200 active:scale-[0.98] ${
                canSend && storeOpen
                  ? "cursor-pointer bg-[#25d366] hover:bg-[#20ba59] hover:brightness-105"
                  : "cursor-not-allowed bg-[#25d366]/40 opacity-70"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-5 shrink-0"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>
                {!storeOpen
                  ? "Loja Fechada no Momento"
                  : canSend
                    ? `Enviar Pedido via WhatsApp · R$ ${formatPrice(totalComFrete)}`
                    : "Preencha Bairro e Endereço"}
              </span>
            </button>
            <p className="text-center font-mono text-[0.62rem] text-muted">
              🔒 O pedido é revisado com nossa equipe diretamente no WhatsApp
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
