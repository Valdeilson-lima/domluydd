import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { DbOrder } from "@/types/supabase";

export async function GET() {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      configured: false,
      orders: [],
      message:
        "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.",
    });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ configured: true, orders: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.customer_name || !body.items || !body.total) {
      return NextResponse.json(
        { error: "Dados incompletos do pedido." },
        { status: 400 }
      );
    }

    // Bloqueia pedidos caso o dono tenha fechado a pizzaria manualmente
    const globalStore = globalThis as unknown as {
      __donluyddStoreSettings?: {
        mode: "auto" | "open" | "closed";
        custom_message: string | null;
      };
    };
    if (globalStore.__donluyddStoreSettings?.mode === "closed") {
      return NextResponse.json(
        {
          error:
            globalStore.__donluyddStoreSettings.custom_message ||
            "A Don Luydd Pizzaria está fechada para novos pedidos no momento.",
        },
        { status: 403 }
      );
    }

    if (!isSupabaseConfigured || !supabase) {
      // Retorna sucesso com ID simulado se o Supabase ainda não estiver configurado
      const simulatedId = "local-" + Date.now();
      return NextResponse.json({
        configured: false,
        orderId: simulatedId,
        message: "Pedido registrado localmente (Supabase não conectado).",
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: body.customer_name,
          customer_phone: body.customer_phone || null,
          delivery_type: body.delivery_type || "delivery",
          address: body.address || null,
          bairro: body.bairro || null,
          cep: body.cep || null,
          complement: body.complement || null,
          items: body.items,
          subtotal: body.subtotal || body.total,
          delivery_fee: body.delivery_fee || 0,
          total: body.total,
          payment_method: body.payment_method,
          change_for: body.change_for || null,
          status: "pending",
          notes: body.notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      configured: true,
      orderId: (data as DbOrder).id,
      order: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID e novo status são obrigatórios." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        configured: false,
        success: true,
        message: "Status atualizado localmente.",
      });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ configured: true, order: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
