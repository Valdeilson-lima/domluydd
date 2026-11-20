"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { STORE_SHORT_NAME } from "@/lib/store-config";

interface AdminLoginProps {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [pin, setPin] = useState("");
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
        setError(data?.error || "PIN incorreto.");
        return;
      }

      onSuccess();
    } catch {
      setError("Erro de conexão ao validar o PIN.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-8 sm:px-6"
    >
      <div className="grid w-full overflow-hidden border border-border bg-card sm:grid-cols-[0.72fr_1.28fr]">
        <aside className="hidden flex-col justify-between bg-primary p-8 text-primary-foreground sm:flex">
          <div
            className="h-12 w-12 rounded-full border-[4px] border-current"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
              Operação
            </p>
            <p className="font-serif text-3xl leading-tight">
              Cozinha aberta.
              <br />
              Pedidos em foco.
            </p>
          </div>
        </aside>
        <div className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Painel da Cozinha · {STORE_SHORT_NAME}</span>
            </div>
            <h1 className="font-serif text-3xl font-normal text-foreground">
              Acesso KDS e Caixa
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
                PIN de Acesso
              </label>
              <input
                id="admin-pin-input"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                name="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="h-11 w-full border border-input bg-background px-3 font-mono text-base tracking-widest text-foreground focus:border-foreground focus:outline-none"
                style={{ borderRadius: "2px" }}
              />
            </div>

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
              disabled={submitting}
              className="h-11 w-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ borderRadius: "2px" }}
            >
              {submitting ? "Verificando…" : "Desbloquear painel"}
            </button>
          </form>

          <div className="border-t border-border pt-4 text-xs">
            <Link
              href="/"
              className="font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
