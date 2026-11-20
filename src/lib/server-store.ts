import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { isScheduleOpen, resolveStoreStatus } from "@/lib/utils";
import type { DbOrder } from "@/types/supabase";
import type { StoreSettings, StoreStatusData } from "@/types/store";

interface ServerMemoryState {
  orders: DbOrder[];
  pausedItems: string[];
  storeSettings: StoreSettings;
  lastSupabaseErrorAt?: number;
}

const globalForStore = globalThis as typeof globalThis & {
  __donluyddServerState?: ServerMemoryState;
};

function getMemoryState(): ServerMemoryState {
  if (!globalForStore.__donluyddServerState) {
    globalForStore.__donluyddServerState = {
      orders: [],
      pausedItems: [],
      storeSettings: {
        id: "main",
        mode: "auto",
        custom_message: null,
        updated_at: new Date().toISOString(),
      },
    };
  }
  return globalForStore.__donluyddServerState;
}

async function withSupabaseTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs = 800
): Promise<T | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function getPausedItems(): Promise<string[]> {
  if (isSupabaseConfigured && supabase) {
    const result = await withSupabaseTimeout(
      supabase
        .from("menu_stock")
        .select("item_name, available")
        .eq("available", false)
    );
    if (result) {
      const { data, error } = result;

      if (!error && Array.isArray(data)) {
        return data.map((row) => String(row.item_name));
      }
    }
  }
  return [...getMemoryState().pausedItems];
}

export async function setItemAvailability(
  itemName: string,
  available: boolean
): Promise<string[]> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("menu_stock").upsert(
      {
        item_name: itemName,
        available,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "item_name" }
    );
    if (!error) {
      return getPausedItems();
    }
  }

  const state = getMemoryState();
  const next = new Set(state.pausedItems);
  if (available) {
    next.delete(itemName);
  } else {
    next.add(itemName);
  }
  state.pausedItems = Array.from(next);
  return [...state.pausedItems];
}

export async function getEffectiveStoreStatus(): Promise<StoreStatusData> {
  const state = getMemoryState();
  let settings = state.storeSettings;
  const inCooldown =
    typeof state.lastSupabaseErrorAt === "number" &&
    Date.now() - state.lastSupabaseErrorAt < 30000;

  if (isSupabaseConfigured && supabase && !inCooldown) {
    try {
      const client = supabase;
      const result = await Promise.race([
        client.from("store_settings").select("*").eq("id", "main").single(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 350)),
      ]);

      if (result && !result.error && result.data) {
        settings = {
          id: result.data.id,
          mode: (result.data.mode as StoreSettings["mode"]) || "auto",
          custom_message: result.data.custom_message ?? null,
          updated_at: result.data.updated_at ?? new Date().toISOString(),
        };
        state.storeSettings = settings;
      } else {
        state.lastSupabaseErrorAt = Date.now();
      }
    } catch {
      state.lastSupabaseErrorAt = Date.now();
    }
  }

  const resolved = resolveStoreStatus({
    mode: settings.mode,
    custom_message: settings.custom_message,
  });

  return {
    isOpen: resolved.open,
    mode: resolved.mode ?? settings.mode ?? "auto",
    customMessage: resolved.customMessage ?? null,
    nextLabel: resolved.nextLabel,
    updatedAt: settings.updated_at || new Date().toISOString(),
    isAutoOpen: isScheduleOpen(),
  };
}

export async function saveStoreSettings(
  nextSettings: StoreSettings
): Promise<StoreStatusData> {
  const updated: StoreSettings = {
    id: "main",
    mode: nextSettings.mode,
    custom_message: nextSettings.custom_message ?? null,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("store_settings")
      .upsert(updated, { onConflict: "id" });

    if (!error) {
      getMemoryState().storeSettings = updated;
      return getEffectiveStoreStatus();
    }
  }

  getMemoryState().storeSettings = updated;
  return getEffectiveStoreStatus();
}

export async function listOrders(limit = 100): Promise<DbOrder[]> {
  if (isSupabaseConfigured && supabase) {
    const result = await withSupabaseTimeout(
      supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)
    );
    if (result) {
      const { data, error } = result;

      if (!error && Array.isArray(data)) {
        return data as DbOrder[];
      }
    }
  }
  return getMemoryState().orders.slice(0, limit);
}

export async function getOrderById(id: string): Promise<DbOrder | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return data as DbOrder;
    }
  }
  return getMemoryState().orders.find((o) => o.id === id) ?? null;
}

export async function createOrder(
  orderInput: Omit<DbOrder, "id" | "created_at" | "status">
): Promise<DbOrder> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("orders")
      .insert([orderInput])
      .select()
      .single();

    if (!error && data) {
      return data as DbOrder;
    }
  }

  const created: DbOrder = {
    ...orderInput,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    status: "pending",
  };
  getMemoryState().orders.unshift(created);
  return created;
}

export async function updateOrderStatus(params: {
  id: string;
  status: DbOrder["status"];
  notes?: string | null;
}): Promise<DbOrder | null> {
  if (isSupabaseConfigured && supabase) {
    const payload: Record<string, unknown> = { status: params.status };
    if (params.notes !== undefined) {
      payload.notes = params.notes;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", params.id)
      .select()
      .single();

    if (!error && data) {
      return data as DbOrder;
    }
  }

  const orders = getMemoryState().orders;
  const idx = orders.findIndex((o) => o.id === params.id);
  if (idx === -1) return null;

  const updated: DbOrder = {
    ...orders[idx],
    status: params.status,
    notes: params.notes !== undefined ? params.notes : orders[idx].notes,
  };
  orders[idx] = updated;
  return updated;
}
