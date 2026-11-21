"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Mail,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import type { AdminRole } from "@/types/store";

export interface AuthenticatedAdminUser {
  userId: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

interface AdminLoginProps {
  needsSetup: boolean;
  tableReady: boolean;
  setupError: string | null;
  onRetryCheck: () => void;
  onSuccess: (user: AuthenticatedAdminUser) => void;
}

type AuthViewMode = "login" | "setup" | "reset";

export function AdminLogin({
  needsSetup,
  tableReady,
  setupError,
  onRetryCheck,
  onSuccess,
}: AdminLoginProps) {
  const [view, setView] = useState<AuthViewMode>(
    needsSetup ? "setup" : "login"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setView(needsSetup ? "setup" : "login");
  }, [needsSetup]);

  const switchView = (next: AuthViewMode) => {
    setView(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (view === "reset") {
      setSubmitting(true);
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reset-password",
            email: trimmedEmail,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error || "Não foi possível enviar o link.");
          return;
        }
        setNotice(
          data?.message ||
            "Se este e-mail estiver cadastrado, enviamos um link de recuperação."
        );
      } catch {
        setError("Erro de conexão ao solicitar recuperação de senha.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (view === "setup") {
      if (fullName.trim().length < 2) {
        setError("Informe seu nome.");
        return;
      }
      if (password.length < 8) {
        setError("A senha deve ter pelo menos 8 caracteres.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não conferem.");
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "setup",
            fullName: fullName.trim(),
            email: trimmedEmail,
            password,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.authenticated || !data?.user) {
          setError(data?.error || "Não foi possível criar a conta de Dono.");
          return;
        }
        onSuccess(data.user as AuthenticatedAdminUser);
      } catch {
        setError("Erro de conexão ao criar conta administrativa.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Login normal
    if (!password) {
      setError("Informe sua senha.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: trimmedEmail,
          password,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.authenticated || !data?.user) {
        setError(data?.error || "E-mail ou senha incorretos.");
        return;
      }
      onSuccess(data.user as AuthenticatedAdminUser);
    } catch {
      setError("Erro de conexão ao autenticar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12"
    >
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
        <div className="space-y-3">
          <BrandMark subtitle="Painel Admin" size="md" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            {view === "setup" ? (
              <UserPlus className="size-3.5" aria-hidden="true" />
            ) : view === "reset" ? (
              <Mail className="size-3.5" aria-hidden="true" />
            ) : (
              <Lock className="size-3.5" aria-hidden="true" />
            )}
            <span>
              {view === "setup"
                ? "Configuração inicial"
                : view === "reset"
                  ? "Recuperar acesso"
                  : "Acesso autenticado"}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-foreground">
            {view === "setup"
              ? "Criar conta do Dono"
              : view === "reset"
                ? "Redefinir senha"
                : "Cozinha e gestão"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {view === "setup"
              ? "Nenhum administrador foi cadastrado ainda. Crie a conta principal do Dono (autenticada no Supabase Auth)."
              : view === "reset"
                ? "Digite seu e-mail cadastrado para receber o link de redefinição de senha."
                : "Entre com seu e-mail e senha cadastrados no Supabase Auth para gerenciar pedidos, cardápio e configurações."}
          </p>
        </div>

        {!tableReady && setupError && (
          <div
            role="alert"
            className="space-y-2.5 rounded-xl border border-accent-gold/50 bg-accent-gold-soft p-4 text-xs text-accent-gold-ink"
          >
            <p className="font-bold">Atualização do banco necessária</p>
            <p>{setupError}</p>
            <button
              type="button"
              onClick={onRetryCheck}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 font-bold text-white"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Verificar novamente
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === "setup" && (
            <div className="space-y-1.5">
              <label
                htmlFor="admin-name-input"
                className="block text-xs font-bold text-foreground"
              >
                Nome do responsável
              </label>
              <input
                id="admin-name-input"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex.: Don Luydd"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3.5 text-base text-foreground sm:text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="admin-email-input"
              className="block text-xs font-bold text-foreground"
            >
              E-mail
            </label>
            <input
              id="admin-email-input"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="dono@donluydd.com.br"
              className="min-h-11 w-full rounded-xl border border-input bg-background px-3.5 text-base text-foreground sm:text-sm"
            />
          </div>

          {view !== "reset" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="admin-password-input"
                  className="block text-xs font-bold text-foreground"
                >
                  Senha
                </label>
                {view === "login" && (
                  <button
                    type="button"
                    onClick={() => switchView("reset")}
                    className="text-xs font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="admin-password-input"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    view === "setup" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={
                    view === "setup"
                      ? "Mínimo 8 caracteres"
                      : "Digite sua senha"
                  }
                  className="min-h-11 w-full rounded-xl border border-input bg-background pl-3.5 pr-12 text-base text-foreground sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
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
          )}

          {view === "setup" && (
            <div className="space-y-1.5">
              <label
                htmlFor="admin-confirm-password"
                className="block text-xs font-bold text-foreground"
              >
                Confirmar senha
              </label>
              <input
                id="admin-confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Repita a senha"
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3.5 text-base text-foreground sm:text-sm"
              />
            </div>
          )}

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

          {notice && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-status-open/30 bg-status-open/10 px-3.5 py-2.5 text-xs font-semibold text-status-open"
            >
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>{notice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !tableReady}
            className="min-h-12 w-full rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.985] disabled:opacity-50"
          >
            {submitting
              ? "Processando…"
              : view === "setup"
                ? "Criar conta de Dono e entrar"
                : view === "reset"
                  ? "Enviar link de recuperação"
                  : "Entrar no painel"}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs">
          {view === "setup" ? (
            <button
              type="button"
              onClick={() => switchView("login")}
              className="font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              Já tenho conta no Supabase Auth
            </button>
          ) : view === "reset" ? (
            <button
              type="button"
              onClick={() => switchView("login")}
              className="font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              Voltar para o login
            </button>
          ) : needsSetup ? (
            <button
              type="button"
              onClick={() => switchView("setup")}
              className="font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              Criar primeira conta de Dono
            </button>
          ) : (
            <span className="text-muted-foreground">
              Protegido por Supabase Auth
            </span>
          )}

          <Link
            href="/"
            className="font-bold text-muted-foreground underline underline-offset-4 hover:text-primary"
          >
            Página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}
