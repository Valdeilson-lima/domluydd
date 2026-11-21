import { NextRequest, NextResponse } from "next/server";
import {
  applyRefreshedCookies,
  bootstrapFirstOwner,
  checkLoginRateLimit,
  clearAdminSessionCookies,
  clearLoginAttempts,
  getAdminSession,
  getAdminSetupState,
  getClientIp,
  recordFailedLoginAttempt,
  requestAdminPasswordReset,
  setAdminSessionCookies,
  signInAdminWithPassword,
} from "@/lib/admin-auth";
import { SITE_URL } from "@/lib/store-config";

export async function GET(request: NextRequest) {
  const [setup, auth] = await Promise.all([
    getAdminSetupState(),
    getAdminSession(request),
  ]);

  const response = NextResponse.json({
    authenticated: Boolean(auth.session),
    user: auth.session,
    needsSetup: setup.needsSetup,
    tableReady: setup.tableReady,
    supabaseReady: setup.supabaseReady,
    setupError: setup.error ?? null,
  });

  if (auth.refreshedTokens) {
    applyRefreshedCookies(response, auth.refreshedTokens);
  }
  return response;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  try {
    const body = await request.json();
    const action = typeof body?.action === "string" ? body.action : "login";

    if (action === "reset-password") {
      const limit = checkLoginRateLimit(`reset:${ip}`);
      if (!limit.allowed) {
        const minutes = Math.ceil(limit.retryAfterSeconds / 60);
        return NextResponse.json(
          {
            ok: false,
            error: `Muitas solicitações. Aguarde ${minutes} min para tentar novamente.`,
          },
          { status: 429 }
        );
      }

      const email = typeof body?.email === "string" ? body.email.trim() : "";
      if (!email || !email.includes("@")) {
        return NextResponse.json(
          { ok: false, error: "Informe um e-mail válido." },
          { status: 400 }
        );
      }

      recordFailedLoginAttempt(`reset:${ip}`);
      const origin =
        request.headers.get("origin") ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        SITE_URL;
      const redirectTo = `${origin.replace(/\/$/, "")}/admin/reset-password`;
      await requestAdminPasswordReset(email, redirectTo);

      // Resposta neutra para evitar enumeração de contas
      return NextResponse.json({
        ok: true,
        message:
          "Se este e-mail estiver cadastrado, enviamos um link para redefinir sua senha.",
      });
    }

    const limit = checkLoginRateLimit(`login:${ip}`);
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSeconds / 60);
      return NextResponse.json(
        {
          authenticated: false,
          error: `Muitas tentativas incorretas. Aguarde ${minutes} min para tentar novamente.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    if (action === "setup") {
      const fullName =
        typeof body?.fullName === "string" ? body.fullName.trim() : "";
      const email = typeof body?.email === "string" ? body.email.trim() : "";
      const password = typeof body?.password === "string" ? body.password : "";

      const result = await bootstrapFirstOwner({ fullName, email, password });
      if (!result.ok || !result.session || !result.tokens) {
        recordFailedLoginAttempt(`login:${ip}`);
        return NextResponse.json(
          {
            authenticated: false,
            error: result.error || "Não foi possível criar o acesso de Dono.",
          },
          { status: result.status || 400 }
        );
      }

      clearLoginAttempts(`login:${ip}`);
      const response = NextResponse.json({
        authenticated: true,
        user: result.session,
      });
      setAdminSessionCookies(response, result.tokens);
      return response;
    }

    // Login padrão (e-mail + senha no Supabase Auth)
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { authenticated: false, error: "Informe e-mail e senha." },
        { status: 400 }
      );
    }

    const result = await signInAdminWithPassword(email, password);
    if (!result.ok || !result.session || !result.tokens) {
      recordFailedLoginAttempt(`login:${ip}`);
      return NextResponse.json(
        {
          authenticated: false,
          error: result.error || "E-mail ou senha incorretos.",
        },
        { status: result.status || 401 }
      );
    }

    clearLoginAttempts(`login:${ip}`);
    const response = NextResponse.json({
      authenticated: true,
      user: result.session,
    });
    setAdminSessionCookies(response, result.tokens);
    return response;
  } catch {
    return NextResponse.json(
      { authenticated: false, error: "Requisição inválida." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false, user: null });
  clearAdminSessionCookies(response);
  return response;
}
