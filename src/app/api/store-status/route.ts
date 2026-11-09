import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { resolveStoreStatus, isScheduleOpen } from "@/lib/utils";
import type { StoreMode, StoreSettings } from "@/types/store";

// Cache em memória compartilhado e preservado durante a execução do Node.js
interface StoreGlobalState {
  mode: StoreMode;
  custom_message: string | null;
  updated_at: string;
}

const globalStore = globalThis as unknown as {
  __donluyddStoreSettings?: StoreGlobalState;
};

if (!globalStore.__donluyddStoreSettings) {
  globalStore.__donluyddStoreSettings = {
    mode: "auto",
    custom_message: null,
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  let settings: StoreSettings = {
    mode: globalStore.__donluyddStoreSettings?.mode || "auto",
    custom_message: globalStore.__donluyddStoreSettings?.custom_message || null,
    updated_at:
      globalStore.__donluyddStoreSettings?.updated_at ||
      new Date().toISOString(),
  };

  let fromSupabase = false;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("id", "main")
        .maybeSingle();

      if (!error && data) {
        settings = {
          mode: (data.mode as StoreMode) || "auto",
          custom_message: data.custom_message || null,
          updated_at: data.updated_at || new Date().toISOString(),
        };
        // Sincroniza cache local com o banco
        globalStore.__donluyddStoreSettings = {
          mode: settings.mode,
          custom_message: settings.custom_message || null,
          updated_at: settings.updated_at || new Date().toISOString(),
        };
        fromSupabase = true;
      }
    } catch {
      // Falha silenciosa de conexão ou tabela ainda não criada
    }
  }

  const resolved = resolveStoreStatus({
    mode: settings.mode,
    custom_message: settings.custom_message,
  });

  return NextResponse.json({
    configured: isSupabaseConfigured,
    fromSupabase,
    mode: settings.mode,
    customMessage: settings.custom_message || null,
    isOpen: resolved.open,
    nextLabel: resolved.nextLabel,
    updatedAt: settings.updated_at,
    isAutoOpen: isScheduleOpen(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body.mode as StoreMode;

    if (!mode || !["auto", "open", "closed"].includes(mode)) {
      return NextResponse.json(
        { error: "Modo inválido. Escolha 'auto', 'open' ou 'closed'." },
        { status: 400 }
      );
    }

    const customMessage =
      typeof body.customMessage === "string" &&
      body.customMessage.trim().length > 0
        ? body.customMessage.trim()
        : null;

    const updatedAt = new Date().toISOString();

    // 1. Atualiza cache em memória imediato
    globalStore.__donluyddStoreSettings = {
      mode,
      custom_message: customMessage,
      updated_at: updatedAt,
    };

    const resolved = resolveStoreStatus({
      mode,
      custom_message: customMessage,
    });

    let savedToSupabase = false;

    // 2. Tenta persistir no Supabase se configurado
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("store_settings").upsert({
          id: "main",
          mode,
          is_open: resolved.open,
          custom_message: customMessage,
          updated_at: updatedAt,
        });

        if (!error) {
          savedToSupabase = true;
        }
      } catch {
        // Ignora se tabela ainda não tiver sido criada pelo usuário
      }
    }

    return NextResponse.json({
      success: true,
      savedToSupabase,
      mode,
      customMessage,
      isOpen: resolved.open,
      nextLabel: resolved.nextLabel,
      updatedAt,
      isAutoOpen: isScheduleOpen(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
