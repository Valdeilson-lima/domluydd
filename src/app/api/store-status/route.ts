import { NextRequest, NextResponse } from "next/server";
import { applyRefreshedCookies, requireAdminSession } from "@/lib/admin-auth";
import {
  getEffectiveStoreStatus,
  saveStoreProfile,
  saveStoreSettings,
} from "@/lib/server-store";
import type { StoreMode, StoreProfile } from "@/types/store";

const VALID_MODES: StoreMode[] = ["auto", "open", "closed"];

export async function GET() {
  try {
    const status = await getEffectiveStoreStatus();
    return NextResponse.json(status, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao consultar status da loja." },
      { status: 500 }
    );
  }
}

async function handleUpdateStoreStatus(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const mode = body?.mode as StoreMode;
    const rawCustomMessage = body?.custom_message ?? body?.customMessage;
    const customMessage =
      typeof rawCustomMessage === "string"
        ? rawCustomMessage.trim().slice(0, 180) || null
        : null;

    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json(
        { error: "Modo de operação inválido." },
        { status: 400 }
      );
    }

    const updated = await saveStoreSettings({
      id: "main",
      mode,
      custom_message: customMessage,
    });
    return applyRefreshedCookies(
      NextResponse.json(updated),
      auth.refreshedTokens
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar status da loja." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleUpdateStoreStatus(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpdateStoreStatus(request);
}

/** Atualização completa das Configurações da Loja (PIX, horários, contato, retiradas) — somente Dono. */
export async function PUT(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as Partial<StoreProfile>;
    const result = await saveStoreProfile(body);
    if (!result.ok || !result.status) {
      return NextResponse.json(
        { error: result.error || "Não foi possível salvar as configurações." },
        { status: 400 }
      );
    }

    return applyRefreshedCookies(
      NextResponse.json(result.status),
      auth.refreshedTokens
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao salvar configurações da loja." },
      { status: 500 }
    );
  }
}
