"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bairros } from "@/data/bairros";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import {
  clearCustomerDraft,
  loadCustomerDraft,
  saveCustomerDraft,
  saveLastOrder,
} from "@/lib/order-storage";
import { calculateOrderTotals } from "@/lib/pricing";
import {
  STORE_PICKUP_ADDRESS,
  STORE_PIX_KEY,
  STORE_PIX_KEY_FORMATTED,
} from "@/lib/store-config";
import { formatPrice } from "@/lib/utils";
import type { CartItem, CustomerData } from "@/types";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  onOrderSuccess: () => void;
}

const DEFAULT_DRAFT: CustomerData = {
  name: "",
  phone: "",
  deliveryType: "delivery",
  cep: "",
  bairro: bairros[0]?.nome ?? "Centro",
  rua: "",
  numero: "",
  complemento: "",
  paymentMethod: "Pix",
  trocoPara: "",
  whatsappNotifications: true,
};

export function CheckoutModal({
  open,
  onOpenChange,
  cart,
  onOrderSuccess,
}: CheckoutModalProps) {
  const router = useRouter();
  const { isOpen: storeIsOpen, customMessage, nextLabel } = useStoreStatus();

  const [form, setForm] = useState<CustomerData>(DEFAULT_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    if (!open) return;
    const saved = loadCustomerDraft();
    if (saved) {
      setForm((prev) => ({
        ...prev,
        ...saved,
        whatsappNotifications: saved.whatsappNotifications !== false,
        bairro: saved.bairro || prev.bairro,
        paymentMethod: saved.paymentMethod || prev.paymentMethod,
      }));
    }
    setError(null);
  }, [open]);

  const updateField = <K extends keyof CustomerData>(
    key: K,
    value: CustomerData[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      saveCustomerDraft(next);
      return next;
    });
  };

  const totals = useMemo(
    () =>
      calculateOrderTotals({
        items: cart,
        deliveryType: form.deliveryType,
        bairroName: form.bairro,
      }),
    [cart, form.deliveryType, form.bairro]
  );

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(STORE_PIX_KEY);
      setCopiedPix(true);
      window.setTimeout(() => setCopiedPix(false), 2000);
    } catch {
      // clipboard fallback ignored safely
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!storeIsOpen) {
      setError(customMessage || `Estamos fechados no momento. ${nextLabel}`);
      return;
    }

    if (cart.length === 0) {
      setError("Sua sacola está vazia.");
      return;
    }

    if (form.name.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Informe um telefone ou WhatsApp válido com DDD.");
      return;
    }

    if (form.deliveryType === "delivery") {
      if (!form.bairro) {
        setError("Selecione o bairro para entrega.");
        return;
      }
      if (!form.rua.trim() || !form.numero.trim()) {
        setError("Informe a rua e o número para entrega.");
        return;
      }
    }

    const parsedTroco = form.trocoPara.trim()
      ? Number(form.trocoPara.replace(",", "."))
      : null;

    if (
      form.paymentMethod === "Dinheiro" &&
      parsedTroco !== null &&
      (!Number.isFinite(parsedTroco) || parsedTroco < totals.total)
    ) {
      setError(
        `O valor para troco deve ser maior ou igual a R$ ${formatPrice(totals.total)}.`
      );
      return;
    }

    const formattedAddress =
      form.deliveryType === "delivery"
        ? `${form.rua.trim()}, ${form.numero.trim()}`
        : STORE_PICKUP_ADDRESS;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          delivery_type: form.deliveryType,
          address: formattedAddress,
          bairro: form.deliveryType === "delivery" ? form.bairro : null,
          cep: form.cep.trim() || null,
          complement: form.complemento.trim() || null,
          items: cart,
          payment_method: form.paymentMethod,
          change_for: form.paymentMethod === "Dinheiro" ? parsedTroco : null,
          whatsapp_notifications: form.whatsappNotifications,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) {
        setError(
          data?.error ||
            "Não foi possível enviar o pedido. Verifique os dados e tente novamente."
        );
        return;
      }

      saveLastOrder({
        id: data.id,
        date: data.created_at || new Date().toISOString(),
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        delivery_type: data.delivery_type,
        deliveryType: data.delivery_type,
        address: data.address,
        bairro: data.bairro,
        complement: data.complement,
        cep: data.cep,
        items: data.items || cart,
        subtotal: data.subtotal ?? totals.subtotal,
        delivery_fee: data.delivery_fee ?? totals.deliveryFee,
        total: data.total ?? totals.total,
        payment_method: data.payment_method,
        change_for: data.change_for,
        status: data.status || "pending",
      });

      clearCustomerDraft();
      setForm(DEFAULT_DRAFT);
      setError(null);
      onOrderSuccess();
      onOpenChange(false);
      router.push(`/pedido/${data.id}`);
    } catch {
      setError("Falha de conexão ao enviar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto border border-border bg-background text-foreground p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-2xl font-normal text-foreground">
            Finalizar pedido
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Informe como deseja receber sua pizza e a forma de pagamento.
          </DialogDescription>
        </DialogHeader>

        {!storeIsOpen && (
          <div
            role="status"
            className="border border-foreground bg-secondary px-4 py-3 text-xs font-semibold text-foreground"
          >
            Loja fechada no momento. {customMessage || nextLabel}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="checkout-name"
                className="block text-xs font-semibold text-foreground"
              >
                Nome completo *
              </label>
              <input
                id="checkout-name"
                type="text"
                name="name"
                autoComplete="name"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ex.: Ana Lima…"
                className="h-10 w-full border border-input bg-card px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                style={{ borderRadius: "2px" }}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="checkout-phone"
                className="block text-xs font-semibold text-foreground"
              >
                WhatsApp / Telefone *
              </label>
              <input
                id="checkout-phone"
                type="tel"
                name="phone"
                autoComplete="tel-national"
                inputMode="tel"
                required
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Ex.: (83) 99999-9999…"
                className="h-10 w-full border border-input bg-card px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                style={{ borderRadius: "2px" }}
              />
            </div>
          </div>

          <label
            htmlFor="checkout-whatsapp-notifications"
            className="flex min-h-11 cursor-pointer items-start gap-3 border border-border bg-card p-3"
          >
            <input
              id="checkout-whatsapp-notifications"
              name="whatsappNotifications"
              type="checkbox"
              checked={form.whatsappNotifications}
              onChange={(e) =>
                updateField("whatsappNotifications", e.target.checked)
              }
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <span className="text-xs leading-5 text-muted-foreground">
              <strong className="text-foreground">
                Receber atualizações no WhatsApp.
              </strong>{" "}
              Vou receber o pedido confirmado e as mudanças de preparo e
              entrega.
            </span>
          </label>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recebimento
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateField("deliveryType", "delivery")}
                className={`h-10 border text-xs font-semibold ${
                  form.deliveryType === "delivery"
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                }`}
                style={{ borderRadius: "2px" }}
              >
                Entrega em casa
              </button>
              <button
                type="button"
                onClick={() => updateField("deliveryType", "takeaway")}
                className={`h-10 border text-xs font-semibold ${
                  form.deliveryType === "takeaway"
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                }`}
                style={{ borderRadius: "2px" }}
              >
                Retirar no balcão
              </button>
            </div>
          </fieldset>

          {form.deliveryType === "takeaway" ? (
            <div className="border border-border bg-card p-3 text-xs">
              <p className="font-semibold text-foreground">
                Retirada no balcão (sem taxa de entrega):
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {STORE_PICKUP_ADDRESS}
              </p>
            </div>
          ) : (
            <div className="space-y-3 border border-border bg-card p-3.5">
              <div className="space-y-1">
                <label
                  htmlFor="checkout-bairro"
                  className="block text-xs font-semibold text-foreground"
                >
                  Bairro atendido *
                </label>
                <select
                  id="checkout-bairro"
                  value={form.bairro}
                  onChange={(e) => updateField("bairro", e.target.value)}
                  className="h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                  style={{ borderRadius: "2px" }}
                >
                  {bairros.map((b) => (
                    <option key={b.nome} value={b.nome}>
                      {b.nome} (+R$ {formatPrice(b.frete)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                <div className="space-y-1">
                  <label
                    htmlFor="checkout-rua"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Rua / Avenida *
                  </label>
                  <input
                    id="checkout-rua"
                    type="text"
                    name="street"
                    autoComplete="street-address"
                    required
                    value={form.rua}
                    onChange={(e) => updateField("rua", e.target.value)}
                    placeholder="Ex.: Rua das Flores…"
                    className="h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                    style={{ borderRadius: "2px" }}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="checkout-numero"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Número *
                  </label>
                  <input
                    id="checkout-numero"
                    type="text"
                    name="house-number"
                    required
                    value={form.numero}
                    onChange={(e) => updateField("numero", e.target.value)}
                    placeholder="Ex.: 123…"
                    className="h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                    style={{ borderRadius: "2px" }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="checkout-cep"
                    className="block text-xs font-semibold text-foreground"
                  >
                    CEP (opcional)
                  </label>
                  <input
                    id="checkout-cep"
                    type="text"
                    name="postal-code"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    spellCheck={false}
                    value={form.cep}
                    onChange={(e) => updateField("cep", e.target.value)}
                    placeholder="Ex.: 58000-000…"
                    className="h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                    style={{ borderRadius: "2px" }}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="checkout-complemento"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Complemento / Referência
                  </label>
                  <input
                    id="checkout-complemento"
                    type="text"
                    name="address-line2"
                    autoComplete="address-line2"
                    value={form.complemento}
                    onChange={(e) => updateField("complemento", e.target.value)}
                    placeholder="Ex.: Apto 12, bloco B…"
                    className="h-10 w-full border border-input bg-background px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                    style={{ borderRadius: "2px" }}
                  />
                </div>
              </div>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pagamento
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {["Pix", "Cartão (Crédito/Débito)", "Dinheiro"].map((method) => {
                const active = form.paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => updateField("paymentMethod", method)}
                    className={`h-10 border px-2 text-xs font-semibold ${
                      active
                        ? "border-foreground bg-secondary text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                    style={{ borderRadius: "2px" }}
                  >
                    {method === "Cartão (Crédito/Débito)" ? "Cartão" : method}
                  </button>
                );
              })}
            </div>

            {form.paymentMethod === "Pix" && (
              <div className="flex items-center justify-between gap-3 border border-border bg-card p-3 text-xs">
                <div>
                  <p className="font-semibold text-foreground">
                    Chave PIX (Telefone)
                  </p>
                  <p className="font-mono text-muted-foreground">
                    {STORE_PIX_KEY_FORMATTED}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="inline-flex h-8 items-center gap-1.5 border border-border bg-background px-3 font-semibold text-foreground hover:bg-secondary"
                  style={{ borderRadius: "2px" }}
                >
                  {copiedPix ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </>
                  )}
                </button>
              </div>
            )}

            {form.paymentMethod === "Dinheiro" && (
              <div className="space-y-1">
                <label
                  htmlFor="checkout-troco"
                  className="block text-xs font-semibold text-foreground"
                >
                  Troco para quanto? (deixe em branco se não precisar)
                </label>
                <input
                  id="checkout-troco"
                  type="number"
                  step="0.5"
                  min={totals.total}
                  value={form.trocoPara}
                  onChange={(e) => updateField("trocoPara", e.target.value)}
                  placeholder={`Ex.: ${Math.ceil(totals.total / 10) * 10}…`}
                  className="h-10 w-full border border-input bg-card px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
                  style={{ borderRadius: "2px" }}
                />
              </div>
            )}
          </fieldset>

          <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Itens</dt>
              <dd className="font-mono tabular-nums">
                R$ {formatPrice(totals.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Taxa de entrega</dt>
              <dd className="font-mono tabular-nums">
                {totals.deliveryFee > 0
                  ? `R$ ${formatPrice(totals.deliveryFee)}`
                  : "Grátis"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold text-base">
              <dt>Total do pedido</dt>
              <dd className="font-mono tabular-nums">
                R$ {formatPrice(totals.total)}
              </dd>
            </div>
          </dl>

          {error && (
            <p
              role="alert"
              className="border border-foreground bg-secondary px-3 py-2 text-xs font-semibold text-foreground"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !storeIsOpen}
            className="h-11 w-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            style={{ borderRadius: "2px" }}
          >
            {submitting
              ? "Enviando pedido…"
              : `Confirmar pedido · R$ ${formatPrice(totals.total)}`}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
