import { createClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabase-admin";
import type { AdminRole, AdminUserProfile } from "@/types/store";

export const ADMIN_ACCESS_COOKIE = "donluydd_sb_access_token";
export const ADMIN_REFRESH_COOKIE = "donluydd_sb_refresh_token";
export const LEGACY_ADMIN_COOKIE = "donluydd_admin_session";

const ACCESS_TTL_SECONDS = 60 * 60; // 1h
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 min

interface LoginAttemptRecord {
  count: number;
  resetAt: number;
}

export interface AdminSessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AdminSession {
  userId: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

const globalForAuth = globalThis as typeof globalThis & {
  __donluyddLoginAttempts?: Map<string, LoginAttemptRecord>;
};

function getAttemptStore(): Map<string, LoginAttemptRecord> {
  if (!globalForAuth.__donluyddLoginAttempts) {
    globalForAuth.__donluyddLoginAttempts = new Map();
  }
  return globalForAuth.__donluyddLoginAttempts;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "local";
}

export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const store = getAttemptStore();
  const now = Date.now();
  const record = store.get(key);

  if (!record || now >= record.resetAt) {
    if (record) store.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedLoginAttempt(key: string): void {
  const store = getAttemptStore();
  const now = Date.now();
  const record = store.get(key);

  if (!record || now >= record.resetAt) {
    store.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  store.set(key, { count: record.count + 1, resetAt: record.resetAt });
}

export function clearLoginAttempts(key: string): void {
  getAttemptStore().delete(key);
}

function createServerAuthClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function mapAdminUserRow(row: Record<string, unknown>): AdminUserProfile {
  return {
    id: String(row.id),
    email: String(row.email || ""),
    fullName: String(row.full_name || ""),
    role: row.role === "owner" ? "owner" : "kitchen",
    active: row.active !== false,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
  };
}

export async function getAdminSetupState(): Promise<{
  supabaseReady: boolean;
  tableReady: boolean;
  needsSetup: boolean;
  error?: string;
}> {
  if (!supabaseAdmin || !hasServiceRoleKey) {
    return {
      supabaseReady: false,
      tableReady: false,
      needsSetup: false,
      error:
        "Configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    };
  }

  const { count, error } = await supabaseAdmin
    .from("admin_users")
    .select("id", { count: "exact", head: true });

  if (error) {
    const missingTable =
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      /does not exist|schema cache/i.test(error.message);
    return {
      supabaseReady: true,
      tableReady: false,
      needsSetup: false,
      error: missingTable
        ? "Tabela admin_users ainda não existe no Supabase. Execute o arquivo supabase/schema.sql no SQL Editor do Supabase."
        : error.message,
    };
  }

  return {
    supabaseReady: true,
    tableReady: true,
    needsSetup: (count ?? 0) === 0,
  };
}

export async function signInAdminWithPassword(
  email: string,
  password: string
): Promise<{
  ok: boolean;
  session?: AdminSession;
  tokens?: AdminSessionTokens;
  error?: string;
  status?: number;
}> {
  const authClient = createServerAuthClient();
  if (!authClient || !supabaseAdmin || !hasServiceRoleKey) {
    return {
      ok: false,
      status: 503,
      error:
        "Autenticação Supabase não configurada no servidor. Verifique .env.local.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await authClient.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user || !data.session) {
    return {
      ok: false,
      status: 401,
      error: "E-mail ou senha incorretos.",
    };
  }

  const setup = await getAdminSetupState();
  if (!setup.tableReady) {
    return {
      ok: false,
      status: 503,
      error:
        setup.error ||
        "Tabela admin_users ausente. Execute supabase/schema.sql no Supabase.",
    };
  }

  const { data: existingProfile, error: profileErr } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();
  let profileRow = existingProfile;

  // Bootstrap automático: se admin_users estiver 100% vazia, promove o primeiro usuário válido a Dono
  if (!profileErr && !profileRow && setup.needsSetup) {
    const inferredName =
      typeof data.user.user_metadata?.full_name === "string" &&
      data.user.user_metadata.full_name.trim()
        ? data.user.user_metadata.full_name.trim()
        : normalizedEmail.split("@")[0] || "Administrador";

    const inserted = await supabaseAdmin
      .from("admin_users")
      .insert({
        id: data.user.id,
        email: normalizedEmail,
        full_name: inferredName,
        role: "owner",
        active: true,
      })
      .select("*")
      .single();

    if (!inserted.error && inserted.data) {
      profileRow = inserted.data;
    }
  }

  if (profileErr || !profileRow) {
    return {
      ok: false,
      status: 403,
      error:
        "Esta conta existe no Supabase Auth, mas não está autorizada no painel da pizzaria. Peça ao Dono para liberar seu acesso.",
    };
  }

  const mapped = mapAdminUserRow(profileRow as Record<string, unknown>);
  if (!mapped.active) {
    return {
      ok: false,
      status: 403,
      error:
        "Seu acesso ao painel está desativado. Fale com o responsável da pizzaria.",
    };
  }

  return {
    ok: true,
    session: {
      userId: mapped.id,
      email: mapped.email,
      fullName: mapped.fullName || mapped.email,
      role: mapped.role,
    },
    tokens: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  };
}

export async function bootstrapFirstOwner(params: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{
  ok: boolean;
  session?: AdminSession;
  tokens?: AdminSessionTokens;
  error?: string;
  status?: number;
}> {
  if (!supabaseAdmin || !hasServiceRoleKey) {
    return {
      ok: false,
      status: 503,
      error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.",
    };
  }

  const setup = await getAdminSetupState();
  if (!setup.tableReady) {
    return {
      ok: false,
      status: 503,
      error:
        setup.error ||
        "Execute supabase/schema.sql no SQL Editor antes de criar o primeiro acesso.",
    };
  }

  if (!setup.needsSetup) {
    return {
      ok: false,
      status: 403,
      error:
        "O painel já possui um Dono cadastrado. Faça login com seu e-mail e senha.",
    };
  }

  const email = params.email.trim().toLowerCase();
  const fullName = params.fullName.trim().slice(0, 80);
  const password = params.password;

  if (!fullName || fullName.length < 2) {
    return { ok: false, status: 400, error: "Informe seu nome." };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, status: 400, error: "Informe um e-mail válido." };
  }
  if (!password || password.length < 8) {
    return {
      ok: false,
      status: 400,
      error: "A senha deve ter pelo menos 8 caracteres.",
    };
  }

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "owner" },
  });

  if (created.error || !created.data.user) {
    return {
      ok: false,
      status: 400,
      error:
        created.error?.message ||
        "Não foi possível criar a conta. Se este e-mail já existe no Supabase Auth, use a aba 'Entrar' diretamente.",
    };
  }

  const { error: insertErr } = await supabaseAdmin.from("admin_users").insert({
    id: created.data.user.id,
    email,
    full_name: fullName,
    role: "owner",
    active: true,
  });

  if (insertErr) {
    await supabaseAdmin.auth.admin
      .deleteUser(created.data.user.id)
      .catch(() => {});
    return {
      ok: false,
      status: 500,
      error: `Falha ao registrar perfil de Dono: ${insertErr.message}`,
    };
  }

  return signInAdminWithPassword(email, password);
}

export async function requestAdminPasswordReset(
  email: string,
  redirectTo: string
): Promise<{ ok: boolean; error?: string }> {
  const authClient = createServerAuthClient();
  if (!authClient) {
    return { ok: false, error: "Supabase Auth não configurado." };
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, error: "Informe um e-mail válido." };
  }

  const { error } = await authClient.auth.resetPasswordForEmail(normalized, {
    redirectTo,
  });

  if (error) {
    return {
      ok: false,
      error: "Não foi possível enviar o e-mail de recuperação agora.",
    };
  }

  return { ok: true };
}

export async function getAdminSession(request: NextRequest): Promise<{
  session: AdminSession | null;
  refreshedTokens?: AdminSessionTokens;
}> {
  if (!supabaseAdmin || !hasServiceRoleKey) {
    return { session: null };
  }

  const accessToken = request.cookies.get(ADMIN_ACCESS_COOKIE)?.value?.trim();
  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE)?.value?.trim();

  if (!accessToken && !refreshToken) {
    return { session: null };
  }

  let userId: string | null = null;
  let refreshedTokens: AdminSessionTokens | undefined;

  if (accessToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (!error && data.user) {
      userId = data.user.id;
    }
  }

  if (!userId && refreshToken) {
    const authClient = createServerAuthClient();
    if (authClient) {
      const { data, error } = await authClient.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (!error && data.user && data.session) {
        userId = data.user.id;
        refreshedTokens = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        };
      }
    }
  }

  if (!userId) {
    return { session: null };
  }

  const { data: profileRow, error: profileErr } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr || !profileRow) {
    return { session: null };
  }

  const mapped = mapAdminUserRow(profileRow as Record<string, unknown>);
  if (!mapped.active) {
    return { session: null };
  }

  return {
    session: {
      userId: mapped.id,
      email: mapped.email,
      fullName: mapped.fullName || mapped.email,
      role: mapped.role,
    },
    refreshedTokens,
  };
}

export async function requireAdminSession(
  request: NextRequest,
  allowedRoles?: AdminRole[]
): Promise<
  | {
      authorized: true;
      session: AdminSession;
      refreshedTokens?: AdminSessionTokens;
    }
  | {
      authorized: false;
      status: 401 | 403;
      error: string;
    }
> {
  const { session, refreshedTokens } = await getAdminSession(request);
  if (!session) {
    return {
      authorized: false,
      status: 401,
      error: "Sessão expirada ou não autenticada. Faça login novamente.",
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      status: 403,
      error: "Esta ação é permitida apenas para o perfil Dono.",
    };
  }

  return { authorized: true, session, refreshedTokens };
}

export function setAdminSessionCookies(
  response: NextResponse,
  tokens: AdminSessionTokens
): void {
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set(ADMIN_ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  });
  response.cookies.set(ADMIN_REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: REFRESH_TTL_SECONDS,
  });
  response.cookies.delete(LEGACY_ADMIN_COOKIE);
}

export function applyRefreshedCookies(
  response: NextResponse,
  tokens?: AdminSessionTokens
): NextResponse {
  if (tokens) {
    setAdminSessionCookies(response, tokens);
  }
  return response;
}

export function clearAdminSessionCookies(response: NextResponse): void {
  response.cookies.delete(ADMIN_ACCESS_COOKIE);
  response.cookies.delete(ADMIN_REFRESH_COOKIE);
  response.cookies.delete(LEGACY_ADMIN_COOKIE);
}
