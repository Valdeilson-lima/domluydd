"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { supabase } from "@/lib/supabase";

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase Auth não está configurado neste ambiente.");
      return;
    }
    const client = supabase;

    const initRecovery = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error: exErr } =
            await client.auth.exchangeCodeForSession(code);
          if (exErr) {
            setError(
              "Link de recuperação expirado ou inválido. Solicite um novo."
            );
            return;
          }
          setReady(true);
          return;
        }

        const hash = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error: setErr } = await client.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setErr) {
            setError(
              "Link de recuperação expirado ou inválido. Solicite um novo."
            );
            return;
          }
          setReady(true);
          return;
        }

        const { data } = await client.auth.getSession();
        if (data.session) {
          setReady(true);
        } else {
          setError(
            "Sessão de recuperação não localizada. Solicite um novo link na tela de login."
          );
        }
      } catch {
        setError("Não foi possível validar o link de recuperação.");
      }
    };

    initRecovery();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabase) return;
    if (password.length < 8) {
      setError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setSaving(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) {
        setError(updErr.message || "Erro ao atualizar senha.");
        return;
      }
      await supabase.auth.signOut().catch(() => {});
      setDone(true);
      window.setTimeout(() => router.push("/admin"), 1800);
    } catch {
      setError("Falha ao redefinir a senha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
        <div className="space-y-3">
          <BrandMark subtitle="Painel Admin" size="md" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Lock className="size-3.5" aria-hidden="true" />
            <span>Nova senha</span>
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-foreground">
            Redefinir senha
          </h1>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl border border-status-open/30 bg-status-open/10 p-4 text-xs font-semibold text-status-open">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                Senha atualizada com sucesso! Redirecionando para o login do
                painel…
              </span>
            </div>
            <Link
              href="/admin"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="reset-password"
                className="block text-xs font-bold text-foreground"
              >
                Nova senha (mínimo 8 caracteres)
              </label>
              <div className="relative">
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  disabled={!ready}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-input bg-background pl-3.5 pr-12 text-sm text-foreground disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reset-confirm"
                className="block text-xs font-bold text-foreground"
              >
                Confirmar nova senha
              </label>
              <input
                id="reset-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={!ready}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground disabled:opacity-50"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive"
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
              disabled={!ready || saving}
              className="min-h-12 w-full rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar nova senha"}
            </button>
          </form>
        )}

        <div className="border-t border-border pt-4 text-xs">
          <Link
            href="/admin"
            className="font-bold text-muted-foreground underline underline-offset-4 hover:text-primary"
          >
            Voltar para o painel
          </Link>
        </div>
      </div>
    </main>
  );
}
