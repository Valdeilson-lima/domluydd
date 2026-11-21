"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { broadcastCatalogUpdate } from "@/hooks/useCatalog";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { normalizeText } from "@/lib/utils";
import type { CatalogSnapshot } from "@/types";

const STOCK_CHANNEL_NAME = "donluydd_stock_channel";
const CATALOG_CHANNEL_NAME = "donluydd_catalog_channel";
const REALTIME_STOCK_TABLES = ["pizzas", "drinks", "combos"] as const;

export function useStock() {
  const [pausedItems, setPausedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/stock", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.paused)) {
        setPausedItems(data.paused);
      }
    } catch {
      // keep previous state on transient network failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const scheduleRefresh = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        refresh();
      }, 350);
    };

    let stockChannel: BroadcastChannel | null = null;
    let catalogChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      stockChannel = new BroadcastChannel(STOCK_CHANNEL_NAME);
      stockChannel.onmessage = (event) => {
        if (event.data && Array.isArray(event.data.paused)) {
          setPausedItems(event.data.paused);
        } else {
          scheduleRefresh();
        }
      };

      catalogChannel = new BroadcastChannel(CATALOG_CHANNEL_NAME);
      catalogChannel.onmessage = (event) => {
        const cat = event.data?.catalog as CatalogSnapshot | undefined;
        if (cat && Array.isArray(cat.pizzas)) {
          setPausedItems([
            ...cat.pizzas
              .filter((p) => p.available === false)
              .map((p) => p.name),
            ...cat.drinks
              .filter((d) => d.available === false)
              .map((d) => d.name),
            ...cat.combos
              .filter((c) => c.available === false)
              .map((c) => c.name),
          ]);
        } else {
          scheduleRefresh();
        }
      };
    }

    let realtimeChannel: ReturnType<
      NonNullable<typeof supabase>["channel"]
    > | null = null;
    if (isSupabaseConfigured && supabase) {
      try {
        let builder = supabase.channel("realtime_stock_availability");
        for (const table of REALTIME_STOCK_TABLES) {
          builder = builder.on(
            "postgres_changes",
            { event: "*", schema: "public", table },
            scheduleRefresh
          );
        }
        realtimeChannel = builder.subscribe();
      } catch {
        // ignore
      }
    }

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      stockChannel?.close();
      catalogChannel?.close();
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel).catch(() => {});
      }
    };
  }, [refresh]);

  const isPaused = useCallback(
    (itemName: string) => {
      const target = normalizeText(itemName);
      return pausedItems.some((p) => normalizeText(p) === target);
    },
    [pausedItems]
  );

  const toggleStock = useCallback(
    async (
      itemName: string,
      available: boolean
    ): Promise<CatalogSnapshot | undefined> => {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_name: itemName, available }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Não foi possível atualizar o estoque.");
      }

      const data = await res.json();
      if (Array.isArray(data.paused)) {
        setPausedItems(data.paused);
        if (typeof BroadcastChannel !== "undefined") {
          const ch = new BroadcastChannel(STOCK_CHANNEL_NAME);
          ch.postMessage({ paused: data.paused });
          ch.close();
        }
      }
      if (data.catalog) {
        broadcastCatalogUpdate(data.catalog as CatalogSnapshot);
        return data.catalog as CatalogSnapshot;
      }
      return undefined;
    },
    []
  );

  return { pausedItems, loading, isPaused, refresh, toggleStock };
}
