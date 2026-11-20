import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/admin-auth";
import {
  calculateOrderTotals,
  findBairroFee,
  validateAndRepriceItems,
} from "@/lib/pricing";
import {
  createOrder,
  getEffectiveStoreStatus,
  getOrderById,
  getPausedItems,
  listOrders,
  updateOrderStatus,
} from "@/lib/server-store";
import type { CartItem } from "@/types";
import type { OrderStatus } from "@/types/supabase";
import { sendOrderWhatsAppNotification } from "@/lib/whatsapp";

const VALID_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
];

export async function GET(request: NextRequest) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária." },
      { status: 401 }
    );
  }

  try {
    const orders = await listOrders(100);
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar pedidos." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const storeStatus = await getEffectiveStoreStatus();
    if (!storeStatus.isOpen) {
      return NextResponse.json(
        {
          error:
            storeStatus.customMessage ||
            `A pizzaria está fechada no momento. ${storeStatus.nextLabel}`,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const customerName =
      typeof body?.customer_name === "string" ? body.customer_name.trim() : "";
    const customerPhone =
      typeof body?.customer_phone === "string"
        ? body.customer_phone.trim()
        : null;
    const deliveryType =
      body?.delivery_type === "takeaway" ? "takeaway" : "delivery";
    const address =
      typeof body?.address === "string" ? body.address.trim() : null;
    const bairro = typeof body?.bairro === "string" ? body.bairro.trim() : null;
    const cep = typeof body?.cep === "string" ? body.cep.trim() : null;
    const complement =
      typeof body?.complement === "string" ? body.complement.trim() : null;
    const paymentMethod =
      typeof body?.payment_method === "string" && body.payment_method.trim()
        ? body.payment_method.trim()
        : "Pix";
    const rawChangeFor =
      typeof body?.change_for === "number" && Number.isFinite(body.change_for)
        ? body.change_for
        : null;
    const whatsappNotifications = body?.whatsapp_notifications === true;
    const rawItems = Array.isArray(body?.items)
      ? (body.items as CartItem[])
      : [];

    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: "Informe seu nome completo." },
        { status: 400 }
      );
    }

    if (deliveryType === "delivery") {
      if (!address) {
        return NextResponse.json(
          { error: "Informe o endereço completo para entrega." },
          { status: 400 }
        );
      }
      if (!bairro || findBairroFee(bairro) === null) {
        return NextResponse.json(
          { error: "Selecione um bairro atendido válido para entrega." },
          { status: 400 }
        );
      }
    }

    const pausedItems = await getPausedItems();
    const repriced = validateAndRepriceItems(rawItems, pausedItems);
    if (!repriced.ok) {
      return NextResponse.json({ error: repriced.error }, { status: 400 });
    }

    const { subtotal, deliveryFee, total } = calculateOrderTotals({
      items: repriced.items,
      deliveryType,
      bairroName: bairro,
    });

    if (
      paymentMethod.toLowerCase().includes("dinheiro") &&
      rawChangeFor !== null &&
      rawChangeFor < total
    ) {
      return NextResponse.json(
        {
          error: `O valor para troco deve ser maior ou igual ao total do pedido (R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(total)}).`,
        },
        { status: 400 }
      );
    }

    const created = await createOrder({
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_type: deliveryType,
      address: deliveryType === "delivery" ? address : null,
      bairro: deliveryType === "delivery" ? bairro : null,
      cep,
      complement,
      items: repriced.items,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      payment_method: paymentMethod,
      change_for: paymentMethod.toLowerCase().includes("dinheiro")
        ? rawChangeFor
        : null,
      notes:
        typeof body?.notes === "string"
          ? body.notes.trim().slice(0, 240)
          : null,
      whatsapp_notifications: whatsappNotifications,
    });

    const whatsappAccepted = await sendOrderWhatsAppNotification(
      created,
      "pending"
    );

    return NextResponse.json(
      {
        ...created,
        whatsapp_accepted: whatsappAccepted,
        whatsapp_sent: whatsappAccepted,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Erro ao processar pedido." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json(
      { error: "Autenticação administrativa necessária." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const status = body?.status as OrderStatus;
    const notes =
      typeof body?.notes === "string"
        ? body.notes.trim().slice(0, 240)
        : body?.notes === null
          ? null
          : undefined;

    if (!id || !VALID_ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "ID ou status do pedido inválido." },
        { status: 400 }
      );
    }

    const previous = await getOrderById(id);
    const updated = await updateOrderStatus({ id, status, notes });
    if (!updated) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const whatsappAccepted =
      !previous || previous.status !== updated.status
        ? await sendOrderWhatsAppNotification(updated, updated.status)
        : false;

    return NextResponse.json({
      ...updated,
      whatsapp_accepted: whatsappAccepted,
      whatsapp_sent: whatsappAccepted,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar pedido." },
      { status: 500 }
    );
  }
}
