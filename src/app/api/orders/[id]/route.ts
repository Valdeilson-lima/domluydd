import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/server-store";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const trimmed = id?.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Identificador de pedido ausente." },
        { status: 400 }
      );
    }

    const order = await getOrderById(trimmed);
    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar pedido." },
      { status: 500 }
    );
  }
}
