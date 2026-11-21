import { NextResponse } from "next/server";
import { getFullCatalog } from "@/lib/catalog-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await getFullCatalog();
    return NextResponse.json(catalog, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar catálogo." },
      { status: 500 }
    );
  }
}
