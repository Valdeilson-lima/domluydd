"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, AlertCircle } from "lucide-react";
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
  loadCustomerDraft,
  saveCustomerDraft,
  saveLastOrder,
} from "@/lib/order-storage";
import { calculateChange, calculateOrderTotals } from "@/lib/pricing";
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

type FieldErrorKey =
  "name" | "phone" | "bairro" | "rua" | "numero" | "trocoPara";

const FIELD_IDS: Record<FieldErrorKey, string> = {
  name: "checkout-name",
  phone: "checkout-phone",
  bairro: "checkout-bairro",
  rua: "checkout-rua",
  numero: "checkout-numero",
  trocoPara: "checkout-troco",
};

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
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<CustomerData>(DEFAULT_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldErrorKey, string>>
  >({});
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    if (!open) return;
    const saved = loadCustomerDraft();
    if (saved) {
      setForm((prev) => ({
        ...prev,
        ...saved,
        bairro: saved.bairro || prev.bairro,
        paymentMethod:
          saved.paymentMethod || saved.payment || prev.paymentMethod,
      }));
    }
    setServerError(null);
    setFieldErrors({});
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
    if (key in fieldErrors) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key as FieldErrorKey];
        return next;
      });
    }
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

  const parsedTroco = form.trocoPara.trim()
    ? Number(form.trocoPara.replace(",", "."))
    : null;
  const changePreview =
    form.paymentMethod === "Dinheiro"
      ? calculateChange(totals.total, parsedTroco)
      : null;

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(STORE_PIX_KEY);
      setCopiedPix(true);
      window.setTimeout(() => setCopiedPix(false), 2000);
    } catch {
      // clipboard fallback ignored safely
    }
  };

  const validateFields = (): Partial<Record<FieldErrorKey, string>> => {
    const errors: Partial<Record<FieldErrorKey, string>> = {};
    if (form.name.trim().length < 2) {
      errors.name = "Informe seu nome completo (mínimo de 2 letras).";
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      errors.phone =
        "Informe um telefone ou WhatsApp com DDD (ex.: 83 99999-9999).";
    }
    if (form.deliveryType === "delivery") {
      if (!form.bairro) {
        errors.bairro = "Selecione um bairro atendido para entrega.";
      }
      if (!form.rua.trim()) {
        errors.rua = "Informe o nome da rua ou avenida.";
      }
      if (!form.numero.trim()) {
        errors.numero = "Informe o número (ou S/N).";
      }
    }
    if (
      form.paymentMethod === "Dinheiro" &&
      parsedTroco !== null &&
      (!Number.isFinite(parsedTroco) || parsedTroco < totals.total)
    ) {
      errors.trocoPara = `O troco deve ser maior ou igual ao total (R$ ${formatPrice(totals.total)}).`;
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!storeIsOpen) {
      setServerError(
        customMessage || `A pizzaria está fechada no momento. ${nextLabel}`
      );
      return;
    }

    if (cart.length === 0) {
      setServerError("Sua sacola está vazia. Adicione um item para continuar.");
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);
    const errorKeys = Object.keys(errors) as FieldErrorKey[];
    if (errorKeys.length > 0) {
      if (errorKeys.length > 1) {
        window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
      } else {
        const firstId = FIELD_IDS[errorKeys[0]];
        window.setTimeout(() => {
          document.getElementById(firstId)?.focus();
        }, 0);
      }
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
        setServerError(
          data?.error ||
            "Não foi possível enviar o pedido. Revise os campos e tente novamente."
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

      onOrderSuccess();
      onOpenChange(false);
      router.push(`/pedido/${data.id}`);
    } catch {
      setServerError(
        "Falha de conexão ao enviar o pedido. Verifique sua internet e tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const errorEntries = Object.entries(fieldErrors) as Array<
    [FieldErrorKey, string]
  >;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Finalizar pedido</DialogTitle>
          <DialogDescription>
            Seus dados ficam salvos apenas neste dispositivo para agilizar os
            próximos pedidos.
          </DialogDescription>
        </DialogHeader>

        {!storeIsOpen && (
          <div
            role="status"
            className="flex items-start gap-2 border border-foreground bg-secondary px-4 py-3 text-xs font-semibold text-foreground"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>Loja fechada no momento. {customMessage || nextLabel}</span>
          </div>
        )}

        {errorEntries.length > 1 && (
          <div
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            className="space-y-1.5 border border-foreground bg-secondary p-3.5 text-xs"
          >
            <p className="font-semibold text-foreground">
              Corrija os {errorEntries.length} campos abaixo para enviar:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              {errorEntries.map(([key, message]) => (
                <li key={key}>
                  <a
                    href={`#${FIELD_IDS[key]}`}
                    onClick={(ev) => {
                      ev.preventDefault();
                      document.getElementById(FIELD_IDS[key])?.focus();
                    }}
                    className="underline underline-offset-2"
                  >
                    {message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Identificação
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-semibold text-foreground"
                >
                  Nome completo <span aria-hidden="true">*</span>
                </label>
                <input
                  id="checkout-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "err-name" : undefined}
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Ex.: Maria Oliveira…"
                  className={`min-h-11 w-full border bg-card px-3 text-base text-foreground sm:text-sm ${
                    fieldErrors.name ? "border-foreground" : "border-input"
                  }`}
                  style={{ borderRadius: "2px" }}
                />
                {fieldErrors.name && (
                  <p
                    id="err-name"
                    className="text-xs font-semibold text-foreground"
                  >
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-semibold text-foreground"
                >
                  WhatsApp / Telefone <span aria-hidden="true">*</span>
                </label>
                <input
                  id="checkout-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  spellCheck={false}
                  required
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? "err-phone" : undefined}
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(83) 99999-9999…"
                  className={`min-h-11 w-full border bg-card px-3 text-base text-foreground sm:text-sm ${
                    fieldErrors.phone ? "border-foreground" : "border-input"
                  }`}
                  style={{ borderRadius: "2px" }}
                />
                {fieldErrors.phone && (
                  <p
                    id="err-phone"
                    className="text-xs font-semibold text-foreground"
                  >
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
            </div>
            <label
              className="flex min-h-11 cursor-pointer items-center gap-2.5 border border-border bg-card px-3 py-2 text-xs text-foreground"
              style={{ borderRadius: "2px" }}
            >
              <input
                type="checkbox"
                name="whatsappNotifications"
                checked={form.whatsappNotifications}
                onChange={(e) =>
                  updateField("whatsappNotifications", e.target.checked)
                }
                className="size-4 accent-primary"
              />
              <span>Receber atualizações de preparo e entrega no WhatsApp</span>
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              2. Entrega ou retirada
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={form.deliveryType === "delivery"}
                onClick={() => updateField("deliveryType", "delivery")}
                className={`min-h-11 border px-3 text-xs font-semibold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] ${
                  form.deliveryType === "delivery"
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
                style={{ borderRadius: "2px" }}
              >
                Entrega em casa
              </button>
              <button
                type="button"
                aria-pressed={form.deliveryType === "takeaway"}
                onClick={() => updateField("deliveryType", "takeaway")}
                className={`min-h-11 border px-3 text-xs font-semibold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] ${
                  form.deliveryType === "takeaway"
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
                style={{ borderRadius: "2px" }}
              >
                Retirar no balcão
              </button>
            </div>

            {form.deliveryType === "takeaway" ? (
              <div className="border border-border bg-card p-3.5 text-xs">
                <p className="font-semibold text-foreground">
                  Retirada no balcão (sem taxa de entrega):
                </p>
                <p className="mt-1 text-muted-foreground">
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
                    Bairro atendido <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="checkout-bairro"
                    name="bairro"
                    aria-invalid={Boolean(fieldErrors.bairro)}
                    aria-describedby={
                      fieldErrors.bairro ? "err-bairro" : undefined
                    }
                    value={form.bairro}
                    onChange={(e) => updateField("bairro", e.target.value)}
                    className="min-h-11 w-full border border-input bg-background px-3 text-base text-foreground sm:text-sm"
                    style={{ borderRadius: "2px" }}
                  >
                    {bairros.map((b) => (
                      <option key={b.nome} value={b.nome}>
                        {b.nome} (+R$ {formatPrice(b.frete)})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.bairro && (
                    <p
                      id="err-bairro"
                      className="text-xs font-semibold text-foreground"
                    >
                      {fieldErrors.bairro}
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_116px]">
                  <div className="space-y-1">
                    <label
                      htmlFor="checkout-rua"
                      className="block text-xs font-semibold text-foreground"
                    >
                      Rua / Avenida <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="checkout-rua"
                      name="street-address"
                      type="text"
                      autoComplete="address-line1"
                      required
                      aria-invalid={Boolean(fieldErrors.rua)}
                      aria-describedby={fieldErrors.rua ? "err-rua" : undefined}
                      value={form.rua}
                      onChange={(e) => updateField("rua", e.target.value)}
                      placeholder="Ex.: Av. Epitácio Pessoa…"
                      className={`min-h-11 w-full border bg-background px-3 text-base text-foreground sm:text-sm ${
                        fieldErrors.rua ? "border-foreground" : "border-input"
                      }`}
                      style={{ borderRadius: "2px" }}
                    />
                    {fieldErrors.rua && (
                      <p
                        id="err-rua"
                        className="text-xs font-semibold text-foreground"
                      >
                        {fieldErrors.rua}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="checkout-numero"
                      className="block text-xs font-semibold text-foreground"
                    >
                      Número <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="checkout-numero"
                      name="numero"
                      type="text"
                      inputMode="numeric"
                      spellCheck={false}
                      required
                      aria-invalid={Boolean(fieldErrors.numero)}
                      aria-describedby={
                        fieldErrors.numero ? "err-numero" : undefined
                      }
                      value={form.numero}
                      onChange={(e) => updateField("numero", e.target.value)}
                      placeholder="Ex.: 420…"
                      className={`min-h-11 w-full border bg-background px-3 text-base text-foreground sm:text-sm ${
                        fieldErrors.numero
                          ? "border-foreground"
                          : "border-input"
                      }`}
                      style={{ borderRadius: "2px" }}
                    />
                    {fieldErrors.numero && (
                      <p
                        id="err-numero"
                        className="text-xs font-semibold text-foreground"
                      >
                        {fieldErrors.numero}
                      </p>
                    )}
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
                      name="postal-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      spellCheck={false}
                      value={form.cep}
                      onChange={(e) => updateField("cep", e.target.value)}
                      placeholder="58000-000…"
                      className="min-h-11 w-full border border-input bg-background px-3 text-base text-foreground sm:text-sm"
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
                      name="address-line2"
                      type="text"
                      autoComplete="address-line2"
                      value={form.complemento}
                      onChange={(e) =>
                        updateField("complemento", e.target.value)
                      }
                      placeholder="Apto, bloco ou referência…"
                      className="min-h-11 w-full border border-input bg-background px-3 text-base text-foreground sm:text-sm"
                      style={{ borderRadius: "2px" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              3. Pagamento
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {["Pix", "Cartão (Crédito/Débito)", "Dinheiro"].map((method) => {
                const active = form.paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateField("paymentMethod", method)}
                    className={`min-h-11 border px-2 text-xs font-semibold transition-colors ${
                      active
                        ? "border-foreground bg-secondary text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                    style={{ borderRadius: "2px" }}
                  >
                    {method === "Cartão (Crédito/Débito)" ? "Cartão" : method}
                  </button>
                );
              })}
            </div>

            {form.paymentMethod === "Pix" && (
              <div className="flex items-center justify-between gap-3 border border-border bg-card p-3.5 text-xs">
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
                  className="inline-flex min-h-10 items-center gap-1.5 border border-border bg-background px-3.5 font-semibold text-foreground transition-colors hover:border-foreground hover:bg-secondary"
                  style={{ borderRadius: "2px" }}
                >
                  {copiedPix ? (
                    <>
                      <Check className="size-3.5" aria-hidden="true" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden="true" /> Copiar
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
                  name="trocoPara"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min={totals.total}
                  aria-invalid={Boolean(fieldErrors.trocoPara)}
                  aria-describedby={
                    fieldErrors.trocoPara ? "err-troco" : "hint-troco"
                  }
                  value={form.trocoPara}
                  onChange={(e) => updateField("trocoPara", e.target.value)}
                  placeholder={`Ex.: ${Math.ceil(totals.total / 10) * 10}…`}
                  className={`min-h-11 w-full border bg-card px-3 text-base text-foreground sm:text-sm ${
                    fieldErrors.trocoPara ? "border-foreground" : "border-input"
                  }`}
                  style={{ borderRadius: "2px" }}
                />
                {fieldErrors.trocoPara ? (
                  <p
                    id="err-troco"
                    className="text-xs font-semibold text-foreground"
                  >
                    {fieldErrors.trocoPara}
                  </p>
                ) : changePreview !== null ? (
                  <p
                    id="hint-troco"
                    className="font-mono text-xs font-semibold text-status-open tabular-nums"
                  >
                    Troco a levar: R$ {formatPrice(changePreview)}
                  </p>
                ) : (
                  <p id="hint-troco" className="text-xs text-muted-foreground">
                    Informe a nota caso precise que o entregador leve troco.
                  </p>
                )}
              </div>
            )}
          </fieldset>

          <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Itens ({cart.length})</dt>
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
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Total do pedido</dt>
              <dd className="font-mono tabular-nums">
                R$ {formatPrice(totals.total)}
              </dd>
            </div>
          </dl>

          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 border border-foreground bg-secondary px-3.5 py-2.5 text-xs font-semibold text-foreground"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>{serverError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !storeIsOpen}
            className="min-h-12 w-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
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
