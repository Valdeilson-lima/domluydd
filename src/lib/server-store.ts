import {
  DEFAULT_STORE_PROFILE,
  normalizeStoreProfile,
} from "@/lib/store-config";
import {
  hasServiceRoleKey,
  isServerSupabaseConfigured,
  supabaseAdmin,
} from "@/lib/supabase-admin";
import {
  formatScheduleSummary,
  isScheduleOpen,
  resolveStoreStatus,
} from "@/lib/utils";
import type { DbOrder } from "@/types/supabase";
import type {
  StoreMode,
  StoreProfile,
  StoreSettings,
  StoreStatusData,
} from "@/types/store";

interface ServerMemoryState {
  orders: DbOrder[];
  storeMode: StoreMode;
  customMessage: string | null;
  storeProfile: StoreProfile;
  updatedAt: string;
  lastSupabaseErrorAt?: number;
}

const globalForStore = globalThis as typeof globalThis & {
  __donluyddServerState?: ServerMemoryState;
};

function getMemoryState(): ServerMemoryState {
  if (!globalForStore.__donluyddServerState) {
    globalForStore.__donluyddServerState = {
      orders: [],
      storeMode: "auto",
      customMessage: null,
      storeProfile: { ...DEFAULT_STORE_PROFILE },
      updatedAt: new Date().toISOString(),
    };
  }
  return globalForStore.__donluyddServerState;
}

async function withSupabaseTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs = 3500
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

function buildStatusData(
  mode: StoreMode,
  customMessage: string | null,
  profile: StoreProfile,
  updatedAt: string
): StoreStatusData {
  const resolved = resolveStoreStatus({
    mode,
    custom_message: customMessage,
    schedule: profile.schedule,
  });
  const summary = formatScheduleSummary(profile.schedule);

  return {
    isOpen: resolved.open,
    mode: resolved.mode ?? mode ?? "auto",
    customMessage: resolved.customMessage ?? null,
    nextLabel: resolved.nextLabel,
    updatedAt: updatedAt || new Date().toISOString(),
    isAutoOpen: isScheduleOpen(new Date(), profile.schedule),
    hoursLabel: summary.full,
    hoursShort: summary.short,
    profile,
  };
}

export async function getEffectiveStoreStatus(): Promise<StoreStatusData> {
  const state = getMemoryState();
  let mode: StoreMode = state.storeMode;
  let customMessage: string | null = state.customMessage;
  let profile: StoreProfile = state.storeProfile;
  let updatedAt: string = state.updatedAt;

  const inCooldown =
    typeof state.lastSupabaseErrorAt === "number" &&
    Date.now() - state.lastSupabaseErrorAt < 15000;

  if (isServerSupabaseConfigured && supabaseAdmin && !inCooldown) {
    const result = await withSupabaseTimeout(
      supabaseAdmin
        .from("store_settings")
        .select("*")
        .eq("id", "main")
        .single(),
      2000
    );

    if (result && !result.error && result.data) {
      const row = result.data as Record<string, unknown>;
      mode =
        row.mode === "open" || row.mode === "closed" || row.mode === "auto"
          ? row.mode
          : "auto";
      customMessage =
        typeof row.custom_message === "string" ? row.custom_message : null;
      profile = normalizeStoreProfile(row);
      updatedAt =
        typeof row.updated_at === "string"
          ? row.updated_at
          : new Date().toISOString();

      state.storeMode = mode;
      state.customMessage = customMessage;
      state.storeProfile = profile;
      state.updatedAt = updatedAt;
    } else {
      state.lastSupabaseErrorAt = Date.now();
    }
  }

  return buildStatusData(mode, customMessage, profile, updatedAt);
}

export async function saveStoreSettings(
  nextSettings: StoreSettings
): Promise<StoreStatusData> {
  const now = new Date().toISOString();
  const state = getMemoryState();

  const updated = {
    id: "main",
    mode: nextSettings.mode,
    custom_message: nextSettings.custom_message ?? null,
    updated_at: now,
  };

  if (isServerSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from("store_settings")
      .upsert(updated, { onConflict: "id" });

    if (!error) {
      state.storeMode = nextSettings.mode;
      state.customMessage = nextSettings.custom_message ?? null;
      state.updatedAt = now;
      state.lastSupabaseErrorAt = undefined;
      return getEffectiveStoreStatus();
    }
  }

  state.storeMode = nextSettings.mode;
  state.customMessage = nextSettings.custom_message ?? null;
  state.updatedAt = now;
  return buildStatusData(
    state.storeMode,
    state.customMessage,
    state.storeProfile,
    state.updatedAt
  );
}

export async function saveStoreProfile(
  patch: Partial<StoreProfile>
): Promise<{ ok: boolean; status?: StoreStatusData; error?: string }> {
  const current = await getEffectiveStoreStatus();
  const merged = normalizeStoreProfile({
    ...current.profile,
    ...patch,
  });
  const now = new Date().toISOString();

  const dbPayload = {
    id: "main",
    mode: current.mode,
    custom_message: current.customMessage,
    store_name: merged.storeName,
    pickup_address: merged.pickupAddress,
    street_district: merged.streetDistrict,
    city: merged.city,
    whatsapp_number: merged.whatsappNumber,
    whatsapp_display: merged.whatsappDisplay,
    instagram_url: merged.instagramUrl,
    instagram_handle: merged.instagramHandle,
    pix_key: merged.pixKey,
    pix_key_display: merged.pixKeyDisplay,
    pix_key_type: merged.pixKeyType,
    pix_recipient: merged.pixRecipient,
    oven_label: merged.ovenLabel,
    estimated_delivery: merged.estimatedDelivery,
    estimated_pickup: merged.estimatedPickup,
    schedule: merged.schedule,
    common_removals: merged.commonRemovals,
    sweet_removals: merged.sweetRemovals,
    updated_at: now,
  };

  if (isServerSupabaseConfigured && supabaseAdmin) {
    if (!hasServiceRoleKey) {
      return {
        ok: false,
        error:
          "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor para salvar configurações.",
      };
    }

    const { error } = await supabaseAdmin
      .from("store_settings")
      .upsert(dbPayload, { onConflict: "id" });

    if (error) {
      const missingColumn =
        error.code === "PGRST204" ||
        error.code === "42703" ||
        /column .* does not exist|schema cache/i.test(error.message);
      return {
        ok: false,
        error: missingColumn
          ? "As novas colunas de store_settings ainda não foram criadas no Supabase. Execute supabase/schema.sql no SQL Editor do Supabase e tente novamente."
          : `Erro ao salvar configurações no Supabase: ${error.message}`,
      };
    }

    const state = getMemoryState();
    state.storeProfile = merged;
    state.updatedAt = now;
    state.lastSupabaseErrorAt = undefined;
    return { ok: true, status: await getEffectiveStoreStatus() };
  }

  const state = getMemoryState();
  state.storeProfile = merged;
  state.updatedAt = now;
  return {
    ok: true,
    status: buildStatusData(
      state.storeMode,
      state.customMessage,
      state.storeProfile,
      state.updatedAt
    ),
  };
}

export async function listOrders(limit = 100): Promise<DbOrder[]> {
  if (isServerSupabaseConfigured && supabaseAdmin) {
    const result = await withSupabaseTimeout(
      supabaseAdmin
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
  if (isServerSupabaseConfigured && supabaseAdmin) {
    const result = await withSupabaseTimeout(
      supabaseAdmin.from("orders").select("*").eq("id", id).single()
    );
    if (result && !result.error && result.data) {
      return result.data as DbOrder;
    }
  }
  return getMemoryState().orders.find((o) => o.id === id) ?? null;
}

export async function createOrder(
  orderInput: Omit<DbOrder, "id" | "created_at" | "status">
): Promise<DbOrder> {
  if (isServerSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
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
  if (isServerSupabaseConfigured && supabaseAdmin) {
    const payload: Record<string, unknown> = { status: params.status };
    if (params.notes !== undefined) {
      payload.notes = params.notes;
    }

    const { data, error } = await supabaseAdmin
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
