"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StoreMode } from "@/types/store";

interface StoreStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMode: StoreMode;
  currentMessage: string | null;
  isAutoOpen: boolean;
  onSave: (mode: StoreMode, customMessage: string | null) => Promise<boolean>;
}

const MODES: Array<{ value: StoreMode; title: string; desc: string }> = [
  {
    value: "auto",
    title: "Automático (Ter–Dom, 18h às 22h)",
    desc: "Abre e fecha conforme o horário oficial de João Pessoa.",
  },
  {
    value: "open",
    title: "Forçar Loja Aberta",
    desc: "Permite pedidos agora mesmo fora do horário padrão.",
  },
  {
    value: "closed",
    title: "Forçar Loja Fechada",
    desc: "Bloqueia novos pedidos imediatamente até nova alteração.",
  },
];

export function StoreStatusModal({
  open,
  onOpenChange,
  currentMode,
  currentMessage,
  isAutoOpen,
  onSave,
}: StoreStatusModalProps) {
  const [mode, setMode] = useState<StoreMode>(currentMode);
  const [message, setMessage] = useState(currentMessage ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(currentMode);
      setMessage(currentMessage ?? "");
    }
  }, [open, currentMode, currentMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await onSave(mode, message.trim() || null);
      if (ok) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-border bg-background text-foreground p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-2xl font-normal text-foreground">
            Controle de funcionamento
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Horário automático atual:{" "}
            {isAutoOpen ? "Dentro do expediente" : "Fora do expediente"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {MODES.map((opt) => (
              <label
                key={opt.value}
                className={`block cursor-pointer border p-3 ${
                  mode === opt.value
                    ? "border-foreground bg-secondary"
                    : "border-border bg-card"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <input
                    type="radio"
                    name="store-mode"
                    value={opt.value}
                    checked={mode === opt.value}
                    onChange={() => setMode(opt.value)}
                    className="accent-primary"
                  />
                  {opt.title}
                </span>
                <span className="mt-1 block pl-5 text-xs text-muted-foreground">
                  {opt.desc}
                </span>
              </label>
            ))}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="store-custom-message"
              className="block text-xs font-semibold text-foreground"
            >
              Aviso personalizado ao cliente (opcional)
            </label>
            <input
              id="store-custom-message"
              type="text"
              maxLength={180}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex.: Voltamos amanhã às 18h…"
              className="h-11 w-full border border-input bg-card px-3 text-sm text-foreground focus:border-foreground focus:outline-none"
              style={{ borderRadius: "2px" }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="h-11 w-full bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            style={{ borderRadius: "2px" }}
          >
            {saving ? "Salvando…" : "Aplicar configuração"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
