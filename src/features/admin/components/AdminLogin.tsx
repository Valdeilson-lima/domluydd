"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { STORE_SHORT_NAME } from "@/lib/store-config";

interface AdminLoginProps {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pin.trim()) {
      setError("Informe o PIN de acesso da cozinha.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.authenticated) {
        setError(data?.error || "PIN incorreto. Confira e tente novamente.");
        return;
      }

      onSuccess();
    } catch {
      setError("Erro de conexão ao validar o PIN. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12"
    >
      <div className="space-y-6 border border-border bg-card p-6 sm:p-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Lock className="size-3.5" aria-hidden="true" />
            <span translate="no">Painel KDS · {STORE_SHORT_NAME}</span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-foreground">
            Acesso da cozinha e caixa
          </h1>
          <p className="text-sm text-muted-foreground">
            Digite o PIN administrativo configurado no servidor para gerenciar
            pedidos, estoque e impressão térmica.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-pin-input"
              className="block text-xs font-semibold text-foreground"
            >
              PIN de acesso
            </label>
            <div className="relative">
              <input
                id="admin-pin-input"
                name="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                autoComplete="current-password"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "admin-pin-error" : undefined}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Digite o PIN…"
                className="min-h-11 w-full border border-input bg-background pl-3 pr-12 font-mono text-base tracking-widest text-foreground"
                style={{ borderRadius: "2px" }}
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-0.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}
              >
                {showPin ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              id="admin-pin-error"
              role="alert"
              className="flex items-start gap-2 border border-foreground bg-secondary px-3.5 py-2.5 text-xs font-semibold text-foreground"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 w-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.985] disabled:opacity-50"
            style={{ borderRadius: "2px" }}
          >
            {submitting ? "Verificando…" : "Desbloquear painel"}
          </button>
        </form>

        <div className="border-t border-border pt-4 text-xs">
          <Link
            href="/"
            className="font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}
