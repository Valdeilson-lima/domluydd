"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DbOrder } from "@/types/supabase";

interface CancelOrderModalProps {
  order: DbOrder | null;
  onClose: () => void;
  onConfirmCancel: (id: string, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  "Pedido duplicado pelo cliente",
  "Solicitação de cancelamento via WhatsApp",
  "Ingrediente indisponível",
  "Fora da área de entrega",
];

export function CancelOrderModal({
  order,
  onClose,
  onConfirmCancel,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState(PRESET_REASONS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmitting(true);
    try {
      await onConfirmCancel(
        order.id,
        reason.trim() || "Cancelado pela cozinha"
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>Cancelar pedido #{order.id.slice(0, 8)}</DialogTitle>
              <DialogDescription>
                Cliente: {order.customer_name}. Informe o motivo para registro e
                visualização no rastreio.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESET_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      reason === preset
                        ? "border-primary/40 bg-accent-gold-soft text-accent-gold-ink"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cancel-reason-input"
                  className="block text-xs font-bold text-foreground"
                >
                  Motivo do cancelamento
                </label>
                <textarea
                  id="cancel-reason-input"
                  name="cancelReason"
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card p-3 text-base text-foreground sm:text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 flex-1 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-secondary"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-11 flex-1 rounded-xl bg-destructive text-xs font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Cancelando…" : "Confirmar cancelamento"}
                </button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
