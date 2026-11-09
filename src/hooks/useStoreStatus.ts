"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { resolveStoreStatus, isScheduleOpen } from "@/lib/utils";
import type { StoreMode, StoreStatusData } from "@/types/store";

const BROADCAST_CHANNEL_NAME = "donluydd_store_status_channel";

export function useStoreStatus() {
  const [data, setData] = useState<StoreStatusData>(() => {
    const initial = resolveStoreStatus({ mode: "auto" });
    return {
      isOpen: initial.open,
      mode: "auto",
      customMessage: null,
      nextLabel: initial.nextLabel,
      updatedAt: new Date().toISOString(),
      isAutoOpen: isScheduleOpen(),
    };
  });

  const [loading, setLoading] = useState(true);

  // Busca o status mais recente da API
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/store-status");
      if (!res.ok) return;
      const json = await res.json();
      setData({
        isOpen: Boolean(json.isOpen),
        mode: json.mode || "auto",
        customMessage: json.customMessage || null,
        nextLabel: json.nextLabel || "",
        updatedAt: json.updatedAt || new Date().toISOString(),
        isAutoOpen: Boolean(json.isAutoOpen),
      });
    } catch {
      // Falha de rede: mantém status local resolvido
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza o status (usado pelo dono no Admin)
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
        const result = await res.json();

        const updated: StoreStatusData = {
          isOpen: Boolean(result.isOpen),
          mode: result.mode,
          customMessage: result.customMessage || null,
          nextLabel: result.nextLabel,
          updatedAt: result.updatedAt,
          isAutoOpen: Boolean(result.isAutoOpen),
        };

        setData(updated);

        // Notifica outras abas locais instantaneamente via BroadcastChannel
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          try {
            const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
            bc.postMessage(updated);
            bc.close();
          } catch {
            /* ignore */
          }
        }

        return true;
      } catch {
        return false;
      }
    },
    []
  );

  useEffect(() => {
    refresh();

    // 1. Escuta canal local entre abas
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data && typeof event.data.isOpen === "boolean") {
            setData(event.data);
          }
        };
      } catch {
        /* ignore */
      }
    }

    // 2. Escuta mudanças em tempo real pelo Supabase Realtime (se conectado)
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
            (payload) => {
              const newRow = payload.new as
                | {
                    mode?: StoreMode;
                    custom_message?: string | null;
                    updated_at?: string;
                  }
                | undefined;

              if (newRow) {
                const resolved = resolveStoreStatus({
                  mode: newRow.mode,
                  custom_message: newRow.custom_message,
                });
                setData({
                  isOpen: resolved.open,
                  mode: newRow.mode || "auto",
                  customMessage: newRow.custom_message || null,
                  nextLabel: resolved.nextLabel,
                  updatedAt: newRow.updated_at || new Date().toISOString(),
                  isAutoOpen: isScheduleOpen(),
                });
              }
            }
          )
          .subscribe();
      } catch {
        /* ignore */
      }
    }

    // 3. Atualiza ao focar na janela ou periodicamente a cada 30 segundos
    const handleFocus = () => refresh();
    window.addEventListener("focus", handleFocus);
    const interval = setInterval(refresh, 30000);

    return () => {
      bc?.close();
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [refresh]);

  return {
    ...data,
    loading,
    refresh,
    updateStatus,
  };
}
