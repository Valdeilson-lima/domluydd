import { useState } from "react";
import { X, MapPin } from "lucide-react";
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

export function CheckoutModal({
  open,
  cart,
  total,
  onClose,
  onOrderSent,
}: CheckoutModalProps) {
  const [address, setAddress] = useState("");
  const [bairro, setBairro] = useState("");
  const [payment, setPayment] = useState("Dinheiro");
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

  const handleSend = () => {
    if (!bairro) {
      showToast("Selecione o bairro de entrega!");
      return;
    }
    if (!address.trim()) {
      showToast("Informe o endereço de entrega!");
      return;
    }

    const separator = "\n═══════════════════════\n";
    const itemsList = cart
      .map((item, i) => {
        const isHalf =
          item.flavors.length > 1 &&
          item.flavors[0].name !== item.flavors[1].name;
        const name = isHalf
          ? `${item.flavors[0].name} + ${item.flavors[1].name}`
          : item.flavors[0].name;
        return `${i + 1}. *${name}* (${item.size}) — R$ ${formatPrice(item.price)}`;
      })
      .join("\n");

    let msg = "";
    msg += `\u{1F355} *NOVO PEDIDO* \u{1F355}`;
    msg += `\nDon Luydd Pizzaria`;
    msg += separator;
    msg += `\n*ITENS*`;
    msg += `\n${itemsList}`;
    msg += `\n${separator}`;
    msg += `\n*RESUMO*`;
    msg += `\n\u{1F4B0} Subtotal: R$ ${formatPrice(total)}`;
    if (frete > 0) msg += `\n\u{1F69A} Frete: R$ ${formatPrice(frete)}`;
    msg += `\n*\u{1F4B0} Total: R$ ${formatPrice(totalComFrete)}*`;
    msg += `\n${separator}`;
    msg += `\n*ENTREGA*`;
    msg += `\n\u{1F4CD} ${address.trim()}`;
    msg += `\n\u{1F4E6} ${bairro}`;
    msg += `\n${separator}`;
    msg += `\n*PAGAMENTO*`;
    msg += `\n\u{1F4B3} ${payment}`;

    if (
      payment === "Dinheiro" &&
      changeValue &&
      changeValue.num > totalComFrete
    ) {
      msg += `\n\u{1F4B5} Valor pago: R$ ${formatPrice(changeValue.num)}`;
      msg += `\n\u{1FA99} Troco: R$ ${formatPrice(changeValue.change)}`;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    onOrderSent();
    showToast("Pedido enviado com sucesso!");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-450 bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
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
        className={`fixed inset-0 z-451 flex items-center justify-center p-4 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-[20px] border border-white/6 bg-black-light shadow-lg animate-[modalIn_0.3s_ease]">
          <div className="flex items-center justify-between px-6 pt-[18px] pb-0">
            <h3
              id="checkout-title"
              className="font-display text-[1.2rem] font-bold"
            >
              Finalizar pedido
            </h3>
            <button
              onClick={onClose}
              className="flex size-[34px] cursor-pointer items-center justify-center rounded-full bg-white/8 text-muted transition-all duration-200 hover:bg-red-primary hover:text-white"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-6 pb-6 pt-[18px] space-y-5">
            {/* Summary */}
            <div className="rounded-[8px] border border-white/6 bg-white/3 p-3.5">
              {cart.map((item, i) => {
                const isHalf =
                  item.flavors.length > 1 &&
                  item.flavors[0].name !== item.flavors[1].name;
                const name = isHalf
                  ? item.flavors.map((f) => f.name).join(" + ")
                  : item.flavors[0].name;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 py-1.5 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate text-muted">
                      {i + 1}. {name} ({item.size})
                    </span>
                    <span className="shrink-0 font-mono font-semibold text-yellow">
                      R$ {formatPrice(item.price)}
                    </span>
                  </div>
                );
              })}
              <div className="mt-1.5 space-y-1 border-t border-white/8 pt-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-mono text-muted">
                    R$ {formatPrice(total)}
                  </span>
                </div>
                {frete > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow">Frete ({bairro})</span>
                    <span className="font-mono text-yellow">
                      R$ {formatPrice(frete)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-white/4 pt-1.5 text-sm font-bold">
                  <span>Total</span>
                  <span className="font-mono text-base text-yellow-light">
                    R$ {formatPrice(totalComFrete)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bairro */}
            <div className="space-y-2.5">
              <label className="block text-[0.82rem] font-semibold uppercase tracking-[0.5px] text-muted">
                <MapPin className="mr-1 inline size-3.5 align-text-bottom" />
                Bairro de entrega
              </label>
              <select
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full appearance-none rounded-[8px] border-2 border-white/10 bg-black px-3.5 py-3 font-body text-sm text-white outline-none transition-colors duration-200 focus:border-red-primary"
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
            <div className="space-y-2.5">
              <label className="block text-[0.82rem] font-semibold uppercase tracking-[0.5px] text-muted">
                Endereço
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, complemento..."
                rows={2}
                required
                className="w-full resize-y rounded-[8px] border-2 border-white/10 bg-black px-3.5 py-3 font-body text-sm text-white outline-none transition-colors duration-200 placeholder:text-muted focus:border-red-primary min-h-[56px] leading-relaxed"
              />
            </div>

            {/* Payment */}
            <div className="space-y-2.5">
              <label className="block text-[0.82rem] font-semibold uppercase tracking-[0.5px] text-muted">
                Forma de pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Dinheiro",
                  "Cartão de crédito",
                  "Cartão de débito",
                  "PIX",
                ].map((opt) => (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-[8px] border-2 p-3 text-sm font-medium transition-all duration-200 select-none ${
                      payment === opt
                        ? "border-red-primary bg-red-primary/10"
                        : "border-white/10 bg-white/3 hover:border-gray-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt}
                      checked={payment === opt}
                      onChange={(e) => setPayment(e.target.value)}
                      className="sr-only"
                    />
                    <span
                      className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        payment === opt
                          ? "border-red-primary bg-red-primary shadow-[inset_0_0_0_3px] shadow-black-light"
                          : "border-muted"
                      }`}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Change */}
            {payment === "Dinheiro" && (
              <div className="space-y-2.5">
                <label className="block text-[0.82rem] font-semibold uppercase tracking-[0.5px] text-muted">
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
                    className="w-full rounded-[8px] border-2 border-white/10 bg-black py-3 pl-[34px] pr-3.5 font-body text-sm text-white outline-none transition-colors duration-200 placeholder:text-muted focus:border-red-primary"
                  />
                </div>
                {changeValue && changeValue.num >= totalComFrete ? (
                  <div className="text-xs font-semibold text-yellow">
                    Troco: R$ {formatPrice(changeValue.change)}
                  </div>
                ) : changeValue && changeValue.num < totalComFrete ? (
                  <div className="text-xs font-semibold text-yellow">
                    Valor insuficiente para o total do pedido.
                  </div>
                ) : null}
              </div>
            )}

            {/* Send */}
            <button
              onClick={handleSend}
              className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[8px] bg-[#25d366] px-4 py-4 font-body text-base font-bold text-white transition-all duration-200 hover:bg-[#1da851] hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enviar pedido
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
