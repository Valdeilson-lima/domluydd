"use client";

import { useState, useEffect, useCallback } from "react";
import { normalizeText } from "@/lib/utils";

const STOCK_CHANNEL_NAME = "donluydd_stock_channel";

export function useStock() {
  const [pausedItems, setPausedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(STOCK_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data && Array.isArray(event.data.paused)) {
          setPausedItems(event.data.paused);
        } else {
          refresh();
        }
      };
    }

    return () => {
      channel?.close();
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
    async (itemName: string, available: boolean) => {
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
    },
    []
  );

  return { pausedItems, loading, isPaused, refresh, toggleStock };
}
