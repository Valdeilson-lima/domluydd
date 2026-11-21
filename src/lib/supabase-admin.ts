import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const rawServiceKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  ""
).trim();
const supabaseServiceRoleKey =
  rawServiceKey && !rawServiceKey.startsWith("your-") ? rawServiceKey : "";
const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
).trim();

const effectiveKey =
  typeof window === "undefined"
    ? supabaseServiceRoleKey || supabaseAnonKey
    : "";

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  effectiveKey &&
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project")
);

export const hasServiceRoleKey = Boolean(
  typeof window === "undefined" && supabaseServiceRoleKey
);

/**
 * Cliente Supabase exclusivo de servidor.
 * Usa SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY / sb_secret_...) quando configurada
 * para operar com RLS restrito em produção.
 */
export const supabaseAdmin: SupabaseClient | null = isServerSupabaseConfigured
  ? createClient(supabaseUrl, effectiveKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
