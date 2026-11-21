import { NextRequest, NextResponse } from "next/server";
import { applyRefreshedCookies, requireAdminSession } from "@/lib/admin-auth";
import {
  extractPausedItemNames,
  getFullCatalog,
  setCatalogItemAvailability,
} from "@/lib/catalog-store";

export async function GET() {
  try {
    const catalog = await getFullCatalog();
    return NextResponse.json(
      { paused: extractPausedItemNames(catalog) },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ paused: [] });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession(request, ["owner", "kitchen"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const itemName =
      typeof body?.item_name === "string" ? body.item_name.trim() : "";
    const available = Boolean(body?.available);

    if (!itemName) {
      return NextResponse.json(
        { error: "Nome do item é obrigatório." },
        { status: 400 }
      );
    }

    const result = await setCatalogItemAvailability(itemName, available);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Erro ao atualizar disponibilidade." },
        { status: 400 }
      );
    }

    return applyRefreshedCookies(
      NextResponse.json({
        paused: result.paused,
        catalog: result.catalog,
      }),
      auth.refreshedTokens
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar disponibilidade." },
      { status: 500 }
    );
  }
}
