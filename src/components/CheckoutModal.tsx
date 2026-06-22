import { useState } from "react";
import { X, MapPin, Home } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";
import { bairros } from "@/data/bairros";
import { showToast } from "@/components/ui/toast-helpers";

interface CheckoutModalProps {
  open: boolean;
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onOrderSent: () => void;
}

const PAYMENTS = ["Dinheiro", "PIX", "Crédito", "Débito"] as const;
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
  onClose,
  onOrderSent,
}: CheckoutModalProps) {
  const [address, setAddress] = useState("");
  const [bairro, setBairro] = useState("");
  const [payment, setPayment] = useState<string>("Dinheiro");
  const [changeAmount, setChangeAmount] = useState("");

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
        return `*${i + 1}.* ${qtyStr}${name} _(${item.size})_\n     R$ ${formatPrice(lineTotal)}`;
      })
      .join("\n\n");

    const paymentLabel = PAYMENT_LABELS[payment] ?? payment;
    const itemCount = cart.reduce((s, i) => s + i.qty, 0);

    let msg = "";
    msg += `\u{1F355} *DON LUYDD PIZZARIA* \u{1F355}`;
    msg += `\n${line}`;
    msg += `\n\u{1F4C4} *NOVO PEDIDO*`;
    msg += `\n\u{1F4C5} ${dateStr} \u00e0s ${timeStr}`;
    msg += `\n\u{1F6D2} ${itemCount} ${itemCount === 1 ? "item" : "itens"}`;
    msg += `\n${line}`;
    msg += `\n\n\u{1F355} *ITENS DO PEDIDO*`;
    msg += `\n\n${itemsList}`;
    msg += `\n\n${line}`;
    msg += `\n\u{1F4B0} *RESUMO*`;
    msg += `\nSubtotal  R$ ${formatPrice(total)}`;
    if (frete > 0) {
      msg += `\nFrete     R$ ${formatPrice(frete)}`;
    }
    msg += `\n${lineThin}`;
    msg += `\n*TOTAL    R$ ${formatPrice(totalComFrete)}*`;
    msg += `\n${line}`;
    msg += `\n\n\u{1F4CD} *ENTREGA*`;
    msg += `\n\u{1F3E0} ${address.trim()}`;
    msg += `\n\u{1F5FA}\u{FE0F} ${bairro}`;
    msg += `\n${line}`;
    msg += `\n\n\u{1F4B3} *PAGAMENTO*`;
    msg += `\n${paymentLabel}`;

    if (
      payment === "Dinheiro" &&
      changeValue &&
      changeValue.num > totalComFrete
    ) {
      msg += `\n\u{1F4B5} Pago: R$ ${formatPrice(changeValue.num)}`;
      msg += `\n\u{1FA99} Troco: R$ ${formatPrice(changeValue.change)}`;
    }

    msg += `\n${line}`;
    msg += `\n\u{2728} _Pedido enviado pelo cardápio digital_`;

    return msg;
  };

  const handleSend = () => {
    if (!bairro) {
      showToast("Selecione o bairro de entrega");
      return;
    }
    if (!address.trim()) {
      showToast("Informe o endereço de entrega");
      return;
    }

    const msg = buildWhatsAppMessage();
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    setChangeAmount("");
    onOrderSent();
    showToast("Pedido enviado com sucesso");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-450 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className={`fixed inset-0 z-451 flex items-center justify-center p-3 sm:p-4 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-120 max-h-[92vh] overflow-y-auto rounded-[20px] border border-yellow/15 bg-linear-to-b from-black-light to-black shadow-2xl animate-[modalIn_0.3s_ease]">
          <div className="flex items-center justify-between border-b border-white/6 px-5 py-4 sm:px-6">
            <div>
              <p className="font-mono text-[0.55rem] font-semibold uppercase tracking-[0.25em] text-yellow/80">
                Passo final
              </p>
              <h3
                id="checkout-title"
                className="mt-0.5 font-display text-lg font-semibold text-cream [font-variation-settings:'opsz'_36] sm:text-xl"
              >
                Finalizar pedido
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-muted transition-all duration-200 hover:border-red-primary/40 hover:bg-red-primary/15 hover:text-red-light"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4 px-5 py-5 sm:space-y-5 sm:px-6">
            {/* Summary */}
            <div className="rounded-[12px] border border-white/6 bg-white/[0.02] p-3.5">
              <p className="mb-2 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-muted">
                Resumo do pedido
              </p>
              <ul className="space-y-1.5">
                {cart.map((item, i) => {
                  const isHalf =
                    item.flavors.length > 1 &&
                    item.flavors[0].name !== item.flavors[1].name;
                  const name = isHalf
                    ? item.flavors.map((f) => f.name).join(" + ")
                    : item.flavors[0].name;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate text-cream-dim">
                        <span className="font-mono text-muted">{i + 1}.</span>{" "}
                        {item.qty > 1 && (
                          <span className="font-mono text-yellow">
                            {item.qty}x{" "}
                          </span>
                        )}
                        {name} <span className="text-muted">({item.size})</span>
                      </span>
                      <span className="shrink-0 font-mono font-semibold text-yellow">
                        R$ {formatPrice(item.price * item.qty)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2.5 space-y-1 border-t border-white/8 pt-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-mono text-muted">
                    R$ {formatPrice(total)}
                  </span>
                </div>
                {frete > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow">Frete · {bairro}</span>
                    <span className="font-mono text-yellow">
                      R$ {formatPrice(frete)}
                    </span>
                  </div>
                )}
                <div className="flex items-end justify-between border-t border-white/4 pt-2">
                  <span className="text-sm font-bold text-cream">Total</span>
                  <span className="font-display text-lg font-semibold italic text-yellow [font-variation-settings:'opsz'_144]">
                    <span className="not-italic font-mono text-xs text-yellow/70">
                      R${" "}
                    </span>
                    {formatPrice(totalComFrete)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bairro */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">
                <MapPin className="size-3.5 text-yellow" />
                Bairro de entrega
              </label>
              <select
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full appearance-none rounded-[10px] border-2 border-white/10 bg-black px-3.5 py-3 font-body text-sm text-cream outline-none transition-colors duration-200 focus:border-yellow/60"
              >
                <option value="" disabled>
                  Selecione o bairro
                </option>
                {bairros.map((b) => (
                  <option key={b.nome} value={b.nome}>
                    {b.nome} — R$ {formatPrice(b.frete)}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">
                <Home className="size-3.5 text-yellow" />
                Endereço
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, complemento..."
                rows={2}
                required
                className="w-full resize-y rounded-[10px] border-2 border-white/10 bg-black px-3.5 py-3 font-body text-sm text-cream outline-none transition-colors duration-200 placeholder:text-muted/70 focus:border-yellow/60 min-h-14 leading-relaxed"
              />
            </div>

            {/* Payment */}
            <div className="space-y-2">
              <label className="block font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">
                Forma de pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENTS.map((opt) => {
                  const active = payment === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPayment(opt)}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border-2 p-3 text-left text-sm font-medium transition-all duration-200 select-none ${
                        active
                          ? "border-yellow/60 bg-yellow/10 text-cream"
                          : "border-white/10 bg-white/[0.02] text-cream-dim hover:border-white/25"
                      }`}
                    >
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                          active
                            ? "border-yellow bg-yellow shadow-[inset_0_0_0_3px_#141213]"
                            : "border-muted/60"
                        }`}
                      />
                      <span className="min-w-0 flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Change */}
            {payment === "Dinheiro" && (
              <div className="space-y-2">
                <label className="block font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted">
                  Troco para quanto?
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono text-sm text-muted pointer-events-none">
                    R$
                  </span>
                  <input
                    type="text"
                    value={changeAmount}
                    onChange={(e) => setChangeAmount(e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                    className="w-full rounded-[10px] border-2 border-white/10 bg-black py-3 pl-10 pr-3.5 font-body text-sm text-cream outline-none transition-colors duration-200 placeholder:text-muted/70 focus:border-yellow/60"
                  />
                </div>
                {changeValue && changeValue.num >= totalComFrete ? (
                  <div className="text-xs font-semibold text-yellow">
                    Troco para R$ {formatPrice(changeValue.change)}
                  </div>
                ) : changeValue && changeValue.num < totalComFrete ? (
                  <div className="text-xs font-semibold text-red-light">
                    Valor insuficiente — faltam R${" "}
                    {formatPrice(totalComFrete - changeValue.num)}
                  </div>
                ) : null}
              </div>
            )}

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`flex w-full items-center justify-center gap-2.5 rounded-[12px] px-4 py-3.5 font-body text-sm font-bold text-white transition-all duration-200 active:scale-[0.98] sm:py-4 sm:text-base ${
                canSend
                  ? "cursor-pointer bg-[#25d366] hover:bg-[#1da851] hover:shadow-[0_8px_24px_rgba(37,211,102,0.3)]"
                  : "cursor-not-allowed bg-[#25d366]/40"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4 sm:size-5"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {canSend ? "Enviar pelo WhatsApp" : "Preencha os dados"}
            </button>
            <p className="text-center text-[0.65rem] text-muted">
              Você revisa tudo no WhatsApp antes de confirmar
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
