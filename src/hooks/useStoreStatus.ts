"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_STORE_PROFILE,
  normalizeStoreProfile,
} from "@/lib/store-config";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  formatScheduleSummary,
  isScheduleOpen,
  resolveStoreStatus,
} from "@/lib/utils";
import type { StoreMode, StoreProfile, StoreStatusData } from "@/types/store";

const BROADCAST_CHANNEL_NAME = "donluydd_store_status_channel";

function buildDefaultStatus(): StoreStatusData {
  const initial = resolveStoreStatus({
    mode: "auto",
    schedule: DEFAULT_STORE_PROFILE.schedule,
  });
  const summary = formatScheduleSummary(DEFAULT_STORE_PROFILE.schedule);
  return {
    isOpen: initial.open,
    mode: "auto",
    customMessage: null,
    nextLabel: initial.nextLabel,
    updatedAt: new Date().toISOString(),
    isAutoOpen: isScheduleOpen(new Date(), DEFAULT_STORE_PROFILE.schedule),
    hoursLabel: summary.full,
    hoursShort: summary.short,
    profile: DEFAULT_STORE_PROFILE,
  };
}

function normalizeStatusPayload(
  json: Record<string, unknown>
): StoreStatusData {
  const profile = normalizeStoreProfile(
    json.profile as Record<string, unknown> | undefined
  );
  const summary = formatScheduleSummary(profile.schedule);
  return {
    isOpen: Boolean(json.isOpen),
    mode:
      json.mode === "open" || json.mode === "closed" || json.mode === "auto"
        ? json.mode
        : "auto",
    customMessage:
      typeof json.customMessage === "string" ? json.customMessage : null,
    nextLabel: typeof json.nextLabel === "string" ? json.nextLabel : "",
    updatedAt:
      typeof json.updatedAt === "string"
        ? json.updatedAt
        : new Date().toISOString(),
    isAutoOpen: Boolean(json.isAutoOpen),
    hoursLabel:
      typeof json.hoursLabel === "string" ? json.hoursLabel : summary.full,
    hoursShort:
      typeof json.hoursShort === "string" ? json.hoursShort : summary.short,
    profile,
  };
}

function broadcastStoreUpdate(updated: StoreStatusData) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.postMessage(updated);
    bc.close();
  } catch {
    /* ignore */
  }
}

export function useStoreStatus(initialStatus?: StoreStatusData) {
  const [data, setData] = useState<StoreStatusData>(
    () => initialStatus ?? buildDefaultStatus()
  );
  const [loading, setLoading] = useState(!initialStatus);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/store-status", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as Record<string, unknown>;
      setData(normalizeStatusPayload(json));
    } catch {
      // Falha de rede: mantém status atual
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(
    async (
      mode: StoreMode,
      customMessage?: string | null
    ): Promise<boolean> => {
      try {
        const res = await fetch("/api/store-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, customMessage: customMessage || null }),
        });

        if (!res.ok) return false;
        const json = (await res.json()) as Record<string, unknown>;
        const updated = normalizeStatusPayload(json);
        setData(updated);
        broadcastStoreUpdate(updated);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (
      patch: Partial<StoreProfile>
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/store-status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const json = (await res.json().catch(() => null)) as Record<
          string,
          unknown
        > | null;
        if (!res.ok || !json) {
          return {
            ok: false,
            error:
              (typeof json?.error === "string" && json.error) ||
              "Não foi possível salvar as configurações.",
          };
        }
        const updated = normalizeStatusPayload(json);
        setData(updated);
        broadcastStoreUpdate(updated);
        return { ok: true };
      } catch {
        return { ok: false, error: "Erro de rede ao salvar configurações." };
      }
    },
    []
  );

  useEffect(() => {
    if (!initialStatus) {
      refresh();
    }

    // 1. Canal local instantâneo entre abas do mesmo aparelho
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data && typeof event.data.isOpen === "boolean") {
            setData(
              normalizeStatusPayload(event.data as Record<string, unknown>)
            );
          }
        };
      } catch {
        /* ignore */
      }
    }

    // 2. Supabase Realtime em store_settings (reflete status, PIX, horários, contato e retiradas)
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null =
      null;
    if (isSupabaseConfigured && supabase) {
      try {
        channel = supabase
          .channel("realtime_store_status")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "store_settings",
            },
            () => {
              refresh();
            }
          )
          .subscribe();
      } catch {
        /* ignore */
      }
    }

    // 3. Revalidação ao focar janela e a cada 60s (cobre viradas automáticas de horário)
    const handleFocus = () => refresh();
    window.addEventListener("focus", handleFocus);
    const interval = window.setInterval(refresh, 60000);

    return () => {
      bc?.close();
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(interval);
    };
  }, [initialStatus, refresh]);

  return {
    ...data,
    loading,
    refresh,
    updateStatus,
    updateProfile,
  };
}
