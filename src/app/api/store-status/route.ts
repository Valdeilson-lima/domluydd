import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/admin-auth";
import { getEffectiveStoreStatus, saveStoreSettings } from "@/lib/server-store";
import type { StoreMode } from "@/types/store";

const VALID_MODES: StoreMode[] = ["auto", "open", "closed"];

export async function GET() {
  try {
    const status = await getEffectiveStoreStatus();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json(
      { error: "Erro ao consultar status da loja." },
      { status: 500 }
    );
  }
}

async function handleUpdateStoreStatus(request: NextRequest) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária." },
      { status: 401 }
    );
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
    return NextResponse.json(updated);
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
