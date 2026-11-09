import { NextResponse } from "next/server";

// Cache em memória compartilhado durante a execução do processo Node.js
let pausedItemsCache: string[] = [];

export async function GET() {
  return NextResponse.json({
    pausedItems: pausedItemsCache,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (Array.isArray(body.pausedItems)) {
      pausedItemsCache = body.pausedItems.filter(
        (i: unknown) => typeof i === "string"
      );
      return NextResponse.json({
        success: true,
        pausedItems: pausedItemsCache,
      });
    }

    if (body.toggleItem && typeof body.toggleItem === "string") {
      const item = body.toggleItem;
      if (pausedItemsCache.includes(item)) {
        pausedItemsCache = pausedItemsCache.filter((i) => i !== item);
      } else {
        pausedItemsCache.push(item);
      }
      return NextResponse.json({
        success: true,
        pausedItems: pausedItemsCache,
      });
    }

    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
