import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/admin-auth";
import { getPausedItems, setItemAvailability } from "@/lib/server-store";

export async function GET() {
  try {
    const paused = await getPausedItems();
    return NextResponse.json({ paused });
  } catch {
    return NextResponse.json({ paused: [] });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária." },
      { status: 401 }
    );
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

    const paused = await setItemAvailability(itemName, available);
    return NextResponse.json({ paused });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar disponibilidade." },
      { status: 500 }
    );
  }
}
