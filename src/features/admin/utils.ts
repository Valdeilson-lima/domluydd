import {
  getStoreLocalTimeParts,
  normalizeText,
  roundCurrency,
} from "@/lib/utils";
import type {
  CashClosingStats,
  ClosingScope,
  OvenSummaryData,
  SlaInfo,
} from "@/features/admin/types";
import type { DbOrder } from "@/types/supabase";

export function isOrderTodayInStoreTz(isoDate: string): boolean {
  const orderDateKey = getStoreLocalTimeParts(new Date(isoDate)).dateKey;
  const todayKey = getStoreLocalTimeParts(new Date()).dateKey;
  return orderDateKey === todayKey;
}

export function getOrderSla(order: DbOrder, nowMs: number): SlaInfo {
  const createdMs = new Date(order.created_at).getTime();
  const elapsedMinutes = Math.max(0, Math.floor((nowMs - createdMs) / 60000));

  if (order.status === "completed" || order.status === "cancelled") {
    return {
      elapsedMinutes,
      isDelayed: false,
      isWarning: false,
      label: `${elapsedMinutes} min`,
    };
  }

  const isDelayed = elapsedMinutes >= 35;
  const isWarning = !isDelayed && elapsedMinutes >= 20;

  return {
    elapsedMinutes,
    isDelayed,
    isWarning,
    label: isDelayed
      ? `${elapsedMinutes} min (Atrasado)`
      : `${elapsedMinutes} min`,
  };
}

export function computeOvenSummary(orders: DbOrder[]): OvenSummaryData {
  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing"
  );

  const sizesMap = new Map<string, number>();
  const flavorsMap = new Map<string, number>();
  const crustsMap = new Map<string, number>();
  const drinksMap = new Map<string, number>();
  const combosMap = new Map<string, number>();
  const observations: OvenSummaryData["observations"] = [];
  let totalPizzas = 0;

  for (const order of activeOrders) {
    for (const item of order.items) {
      const cat = normalizeText(item.category);
      const qty = Math.max(1, item.qty || 1);

      if (cat === "bebida") {
        const name = item.flavors[0]?.name || "Bebida";
        drinksMap.set(name, (drinksMap.get(name) ?? 0) + qty);
        continue;
      }

      if (cat === "combo") {
        const name = item.flavors[0]?.name || "Combo";
        combosMap.set(name, (combosMap.get(name) ?? 0) + qty);
        continue;
      }

      totalPizzas += qty;
      const sizeKey = item.size.toUpperCase();
      sizesMap.set(sizeKey, (sizesMap.get(sizeKey) ?? 0) + qty);

      const flavorWeight = item.flavors.length > 1 ? 0.5 * qty : qty;
      for (const fl of item.flavors) {
        const current = flavorsMap.get(fl.name) ?? 0;
        flavorsMap.set(fl.name, roundCurrency(current + flavorWeight));
      }

      if (item.crust?.name) {
        crustsMap.set(
          item.crust.name,
          (crustsMap.get(item.crust.name) ?? 0) + qty
        );
      }

      if (item.observation?.trim()) {
        observations.push({
          orderId: order.id.slice(0, 8),
          customer: order.customer_name,
          note: item.observation.trim(),
        });
      }
    }
  }

  return {
    sizes: Array.from(sizesMap.entries()),
    flavors: Array.from(flavorsMap.entries()).sort((a, b) => b[1] - a[1]),
    crusts: Array.from(crustsMap.entries()).sort((a, b) => b[1] - a[1]),
    drinks: Array.from(drinksMap.entries()).sort((a, b) => b[1] - a[1]),
    combos: Array.from(combosMap.entries()).sort((a, b) => b[1] - a[1]),
    totalPizzas,
    observations,
  };
}

export function computeCashClosingStats(
  orders: DbOrder[],
  scope: ClosingScope
): CashClosingStats {
  const scoped =
    scope === "today"
      ? orders.filter((o) => isOrderTodayInStoreTz(o.created_at))
      : orders;

  const validOrders = scoped.filter((o) => o.status !== "cancelled");
  const cancelledOrders = scoped.filter((o) => o.status === "cancelled");

  let totalRevenue = 0;
  let totalDeliveryFees = 0;
  let deliveryCount = 0;
  let takeawayCount = 0;
  const payments = {
    pix: { count: 0, total: 0 },
    cartao: { count: 0, total: 0 },
    dinheiro: { count: 0, total: 0 },
    outro: { count: 0, total: 0 },
  };
  const flavorsMap = new Map<string, number>();

  for (const order of validOrders) {
    const orderTotal = Number(order.total || 0);
    totalRevenue = roundCurrency(totalRevenue + orderTotal);
    totalDeliveryFees = roundCurrency(
      totalDeliveryFees + Number(order.delivery_fee || 0)
    );

    if (order.delivery_type === "takeaway") {
      takeawayCount += 1;
    } else {
      deliveryCount += 1;
    }

    const method = normalizeText(order.payment_method || "");
    if (method.includes("pix")) {
      payments.pix.count += 1;
      payments.pix.total = roundCurrency(payments.pix.total + orderTotal);
    } else if (
      method.includes("cartao") ||
      method.includes("credito") ||
      method.includes("debito")
    ) {
      payments.cartao.count += 1;
      payments.cartao.total = roundCurrency(payments.cartao.total + orderTotal);
    } else if (method.includes("dinheiro")) {
      payments.dinheiro.count += 1;
      payments.dinheiro.total = roundCurrency(
        payments.dinheiro.total + orderTotal
      );
    } else {
      payments.outro.count += 1;
      payments.outro.total = roundCurrency(payments.outro.total + orderTotal);
    }

    for (const item of order.items) {
      const cat = normalizeText(item.category);
      if (cat === "bebida") continue;
      const qty = Math.max(1, item.qty || 1);
      const weight = item.flavors.length > 1 ? 0.5 * qty : qty;
      for (const fl of item.flavors) {
        flavorsMap.set(
          fl.name,
          roundCurrency((flavorsMap.get(fl.name) ?? 0) + weight)
        );
      }
    }
  }

  return {
    totalOrders: scoped.length,
    validOrders,
    cancelledOrders,
    totalRevenue,
    totalDeliveryFees,
    averageTicket:
      validOrders.length > 0
        ? roundCurrency(totalRevenue / validOrders.length)
        : 0,
    deliveryCount,
    takeawayCount,
    payments,
    topFlavors: Array.from(flavorsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8),
  };
}
