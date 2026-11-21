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
import { useStoreStatus } from "@/hooks/useStoreStatus";
import {
  loadCustomerDraft,
  saveCustomerDraft,
  saveLastOrder,
} from "@/lib/order-storage";
import { calculateChange, calculateOrderTotals } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import type { CartItem, CustomerData, DeliveryBairro } from "@/types";
import type { StoreStatusData } from "@/types/store";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  bairros?: DeliveryBairro[];
  initialStoreStatus?: StoreStatusData;
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
  bairro: "",
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
  bairros: propBairros,
  initialStoreStatus,
  onOrderSuccess,
}: CheckoutModalProps) {
  const router = useRouter();
  const {
    isOpen: storeIsOpen,
    customMessage,
    nextLabel,
    profile,
  } = useStoreStatus(initialStoreStatus);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const activeBairros = useMemo(() => {
    const source = propBairros ?? [];
    return source.filter((b) => b.active !== false);
  }, [propBairros]);

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
      const validBairro =
        saved.bairro && activeBairros.some((b) => b.nome === saved.bairro)
          ? saved.bairro
          : (activeBairros[0]?.nome ?? DEFAULT_DRAFT.bairro);
      setForm((prev) => ({
        ...prev,
        ...saved,
        bairro: validBairro,
        paymentMethod:
          saved.paymentMethod || saved.payment || prev.paymentMethod,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        bairro: activeBairros.some((b) => b.nome === prev.bairro)
          ? prev.bairro
          : (activeBairros[0]?.nome ?? DEFAULT_DRAFT.bairro),
      }));
    }
    setServerError(null);
    setFieldErrors({});
  }, [open, activeBairros]);

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
        bairros: activeBairros,
      }),
    [cart, form.deliveryType, form.bairro, activeBairros]
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
      await navigator.clipboard.writeText(profile.pixKey);
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
        : profile.pickupAddress;

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
            className="flex items-start gap-2 rounded-xl border border-accent-gold/50 bg-accent-gold-soft px-4 py-3 text-xs font-bold text-accent-gold-ink"
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
            className="space-y-1.5 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive"
          >
            <p className="font-bold">
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
            <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Identificação
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-bold text-foreground"
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
                  className={`min-h-11 w-full rounded-xl border bg-card px-3 text-base text-foreground sm:text-sm ${
                    fieldErrors.name ? "border-destructive" : "border-input"
                  }`}
                />
                {fieldErrors.name && (
                  <p
                    id="err-name"
                    className="text-xs font-semibold text-destructive"
                  >
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-bold text-foreground"
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
                  className={`min-h-11 w-full rounded-xl border bg-card px-3 text-base text-foreground sm:text-sm ${
                    fieldErrors.phone ? "border-destructive" : "border-input"
                  }`}
                />
                {fieldErrors.phone && (
                  <p
                    id="err-phone"
                    className="text-xs font-semibold text-destructive"
                  >
                    {fieldErrors.phone}
                  </p>
                )}
              </div>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground">
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
            <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Entrega ou retirada
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={form.deliveryType === "delivery"}
                onClick={() => updateField("deliveryType", "delivery")}
                className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] ${
                  form.deliveryType === "delivery"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                Entrega em casa
              </button>
              <button
                type="button"
                aria-pressed={form.deliveryType === "takeaway"}
                onClick={() => updateField("deliveryType", "takeaway")}
                className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] ${
                  form.deliveryType === "takeaway"
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                Retirar no balcão
              </button>
            </div>

            {form.deliveryType === "takeaway" ? (
              <div className="rounded-xl border border-border bg-card p-3.5 text-xs">
                <p className="font-bold text-foreground">
                  Retirada no balcão (sem taxa de entrega ·{" "}
                  {profile.estimatedPickup}):
                </p>
                <p className="mt-1 text-muted-foreground">
                  {profile.pickupAddress}
                </p>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-border bg-card p-3.5">
                <div className="space-y-1">
                  <label
                    htmlFor="checkout-bairro"
                    className="block text-xs font-bold text-foreground"
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
                    className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground sm:text-sm"
                  >
                    {activeBairros.map((b) => (
                      <option key={b.nome} value={b.nome}>
                        {b.nome} (+R$ {formatPrice(b.frete)})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.bairro && (
                    <p
                      id="err-bairro"
                      className="text-xs font-semibold text-destructive"
                    >
                      {fieldErrors.bairro}
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_116px]">
                  <div className="space-y-1">
                    <label
                      htmlFor="checkout-rua"
                      className="block text-xs font-bold text-foreground"
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
                      className={`min-h-11 w-full rounded-xl border bg-background px-3 text-base text-foreground sm:text-sm ${
                        fieldErrors.rua ? "border-destructive" : "border-input"
                      }`}
                    />
                    {fieldErrors.rua && (
                      <p
                        id="err-rua"
                        className="text-xs font-semibold text-destructive"
                      >
                        {fieldErrors.rua}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="checkout-numero"
                      className="block text-xs font-bold text-foreground"
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
                      className={`min-h-11 w-full rounded-xl border bg-background px-3 text-base text-foreground sm:text-sm ${
                        fieldErrors.numero
                          ? "border-destructive"
                          : "border-input"
                      }`}
                    />
                    {fieldErrors.numero && (
                      <p
                        id="err-numero"
                        className="text-xs font-semibold text-destructive"
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
                      className="block text-xs font-bold text-foreground"
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
                      className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="checkout-complemento"
                      className="block text-xs font-bold text-foreground"
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
                      className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                    className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {method === "Cartão (Crédito/Débito)" ? "Cartão" : method}
                  </button>
                );
              })}
            </div>

            {form.paymentMethod === "Pix" && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 text-xs">
                <div>
                  <p className="font-bold text-foreground">
                    Chave PIX ({profile.pixKeyType})
                  </p>
                  <p className="font-mono text-muted-foreground">
                    {profile.pixKeyDisplay}
                  </p>
                  {profile.pixRecipient && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Favorecido: {profile.pixRecipient}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 font-bold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                >
                  {copiedPix ? (
                    <>
                      <Check
                        className="size-3.5 text-status-open"
                        aria-hidden="true"
                      />{" "}
                      Copiado
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
                  className="block text-xs font-bold text-foreground"
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
                  className={`min-h-11 w-full rounded-xl border bg-card px-3 text-base text-foreground sm:text-sm ${
                    fieldErrors.trocoPara
                      ? "border-destructive"
                      : "border-input"
                  }`}
                />
                {fieldErrors.trocoPara ? (
                  <p
                    id="err-troco"
                    className="text-xs font-semibold text-destructive"
                  >
                    {fieldErrors.trocoPara}
                  </p>
                ) : changePreview !== null ? (
                  <p
                    id="hint-troco"
                    className="text-xs font-bold text-status-open tabular-nums"
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
              <dd className="font-semibold tabular-nums">
                R$ {formatPrice(totals.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Taxa de entrega</dt>
              <dd className="font-semibold tabular-nums">
                {totals.deliveryFee > 0
                  ? `R$ ${formatPrice(totals.deliveryFee)}`
                  : "Grátis"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold">
              <dt>Total do pedido</dt>
              <dd className="text-primary tabular-nums">
                R$ {formatPrice(totals.total)}
              </dd>
            </div>
          </dl>

          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive"
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
            className="min-h-12 w-full rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
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
