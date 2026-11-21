"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { CatalogSnapshot } from "@/types";

const CATALOG_CHANNEL_NAME = "donluydd_catalog_channel";

const REALTIME_CATALOG_TABLES = [
  "pizzas",
  "drinks",
  "combos",
  "crust_options",
  "extra_ingredients",
  "delivery_neighborhoods",
] as const;

const EMPTY_CATALOG: CatalogSnapshot = {
  source: "supabase",
  supabaseConnected: true,
  hasServiceRoleKey: false,
  needsSeed: false,
  pizzas: [],
  drinks: [],
  combos: [],
  crusts: [],
  extras: [],
  bairros: [],
};

export function broadcastCatalogUpdate(catalog?: CatalogSnapshot) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const ch = new BroadcastChannel(CATALOG_CHANNEL_NAME);
    ch.postMessage(catalog ? { catalog } : { refresh: true });
    ch.close();
  } catch {
    // ignore
  }
}

export function useCatalog(initialCatalog?: CatalogSnapshot) {
  const [catalog, setCatalog] = useState<CatalogSnapshot>(
    initialCatalog ?? EMPTY_CATALOG
  );
  const [loading, setLoading] = useState(!initialCatalog);
  const debounceRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as CatalogSnapshot;
      if (data && Array.isArray(data.pizzas)) {
        setCatalog(data);
      }
    } catch {
      // mantém snapshot atual em falha de rede
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialCatalog) {
      refresh();
    }

    const scheduleRefresh = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        refresh();
      }, 350);
    };

    // 1. Sincronização instantânea entre abas locais
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(CATALOG_CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data?.catalog && Array.isArray(event.data.catalog.pizzas)) {
            setCatalog(event.data.catalog as CatalogSnapshot);
          } else {
            scheduleRefresh();
          }
        };
      } catch {
        // ignore
      }
    }

    // 2. Supabase Realtime nas 6 tabelas públicas do catálogo
    let realtimeChannel: ReturnType<
      NonNullable<typeof supabase>["channel"]
    > | null = null;
    if (isSupabaseConfigured && supabase) {
      try {
        let builder = supabase.channel("realtime_public_catalog");
        for (const table of REALTIME_CATALOG_TABLES) {
          builder = builder.on(
            "postgres_changes",
            { event: "*", schema: "public", table },
            scheduleRefresh
          );
        }
        realtimeChannel = builder.subscribe();
      } catch {
        // fallback silencioso se Realtime estiver indisponível
      }
    }

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      bc?.close();
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel).catch(() => {});
      }
    };
  }, [initialCatalog, refresh]);

  return { catalog, setCatalog, loading, refresh };
}
