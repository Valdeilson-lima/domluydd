import type { DbOrder, OrderStatus } from "@/types/supabase";

const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || "https://evolution.valdeilsonlima.com.br";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "domluydd";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://pizzariadonluydd.valdeilsonlima.com.br";

function normalizePhone(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (!digits.startsWith("55")) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 13) return null;
  return digits;
}

function toWhatsAppJid(phone: string): string {
  return `${phone}@s.whatsapp.net`;
}

function getStatusText(order: DbOrder, status: OrderStatus): string {
  const shortId = order.id.slice(0, 8);
  const trackingUrl = `${SITE_URL}/pedido/${order.id}`;

  if (status === "pending") {
    return `🍕 Pedido recebido — #${shortId}\n\nRecebemos seu pedido na Don Luydd Pizzaria e a cozinha já vai preparar.\n\nAcompanhar: ${trackingUrl}`;
  }
  if (status === "preparing") {
    return `🔥 Pedido em preparo — #${shortId}\n\nSeu pedido entrou na cozinha e está sendo preparado.\n\nAcompanhar: ${trackingUrl}`;
  }
  if (status === "delivering") {
    return order.delivery_type === "delivery"
      ? `🛵 Pedido saiu para entrega — #${shortId}\n\nSeu pedido está a caminho.\n\nAcompanhar: ${trackingUrl}`
      : `✅ Pedido pronto — #${shortId}\n\nSeu pedido está pronto para retirada no balcão.\n\nAcompanhar: ${trackingUrl}`;
  }
  if (status === "completed") {
    return `🍕 Pedido concluído — #${shortId}\n\nSeu pedido foi concluído. Obrigado por pedir na Don Luydd Pizzaria!`;
  }
  return `Pedido cancelado — #${shortId}\n\n${order.notes ? `Motivo: ${order.notes}` : "Sua equipe cancelou este pedido."}\n\nAcompanhar: ${trackingUrl}`;
}

export async function sendOrderWhatsAppNotification(
  order: DbOrder,
  status: OrderStatus
): Promise<boolean> {
  if (order.whatsapp_notifications !== true) {
    console.warn("WhatsApp: notificacoes desativadas para o pedido", order.id);
    return false;
  }
  if (!EVOLUTION_API_KEY) {
    console.error("WhatsApp: EVOLUTION_API_KEY nao configurada");
    return false;
  }

  const number = order.customer_phone
    ? normalizePhone(order.customer_phone)
    : null;
  if (!number) {
    console.warn("WhatsApp: telefone invalido para o pedido", order.id);
    return false;
  }

  const baseUrl = EVOLUTION_API_URL.replace(/\/$/, "");
  const url = `${baseUrl}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: toWhatsAppJid(number),
          text: getStatusText(order, status),
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.ok) {
        console.info("WhatsApp: Evolution aceitou a notificação", {
          orderId: order.id,
          status,
        });
        return true;
      }
      const responseBody = await response.text().catch(() => "");
      console.error(
        "WhatsApp: Evolution recusou o envio",
        response.status,
        responseBody.slice(0, 300)
      );
    } catch {
      // Retry once on network or timeout failures.
    } finally {
      clearTimeout(timeout);
    }
  }

  return false;
}
