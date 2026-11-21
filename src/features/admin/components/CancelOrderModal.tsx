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
      <DialogContent className="max-w-md border border-border bg-background text-foreground p-6">
        {order && (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="font-serif text-2xl font-normal text-foreground">
                Cancelar pedido #{order.id.slice(0, 8)}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
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
                    className={`border px-2.5 py-1 text-xs ${
                      reason === preset
                        ? "border-foreground bg-secondary font-semibold text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                    style={{ borderRadius: "2px" }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="cancel-reason-input"
                  className="block text-xs font-semibold text-foreground"
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
                  className="w-full border border-input bg-card p-2.5 text-base text-foreground sm:text-sm"
                  style={{ borderRadius: "2px" }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 flex-1 border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary"
                  style={{ borderRadius: "2px" }}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 flex-1 bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  style={{ borderRadius: "2px" }}
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
