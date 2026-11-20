"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DbOrder, OrderStatus } from "@/types/supabase";

interface UseAdminOrdersOptions {
  enabled: boolean;
  onUnauthorized?: () => void;
  onNewOrder?: (order: DbOrder) => void;
}

export function useAdminOrders({
  enabled,
  onUnauthorized,
  onNewOrder,
}: UseAdminOrdersOptions) {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const onNewOrderRef = useRef(onNewOrder);
  const onUnauthorizedRef = useRef(onUnauthorized);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
  }, [onNewOrder]);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const playAlertSound = useCallback(() => {
    if (!soundEnabledRef.current || typeof window === "undefined") return;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const notes = [880, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.14, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.13);
      });
    } catch {
      // browser autoplay policy fallback ignored cleanly
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.status === 401) {
        onUnauthorizedRef.current?.();
        return;
      }
      if (!res.ok) {
        setError("Falha ao sincronizar pedidos.");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
        setError(null);
      }
    } catch {
      setError("Sem conexão com o servidor de pedidos.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    refresh();

    const interval = window.setInterval(refresh, 25000);

    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null =
      null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel("admin-kds-orders")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            const incoming = payload.new as DbOrder;
            setOrders((prev) => {
              if (prev.some((o) => o.id === incoming.id)) return prev;
              return [incoming, ...prev];
            });
            playAlertSound();
            onNewOrderRef.current?.(incoming);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders" },
          (payload) => {
            const updated = payload.new as DbOrder;
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
          }
        )
        .subscribe();
    }

    return () => {
      window.clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [enabled, refresh, playAlertSound]);

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus, notes?: string | null) => {
      const previousOrders = orders;
      setError(null);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status, notes: notes !== undefined ? notes : o.notes }
            : o
        )
      );

      try {
        const res = await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status, notes }),
        });

        if (res.status === 401) {
          setOrders(previousOrders);
          onUnauthorizedRef.current?.();
          return false;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setOrders(previousOrders);
          setError(data?.error || "Não foi possível atualizar o status.");
          return false;
        }

        const updated = (await res.json()) as DbOrder;
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.id ? updated : o))
        );
        return true;
      } catch {
        setOrders(previousOrders);
        setError("Erro de rede ao atualizar status do pedido.");
        return false;
      }
    },
    [orders]
  );

  return {
    orders,
    loading,
    error,
    setError,
    soundEnabled,
    setSoundEnabled,
    refresh,
    updateOrderStatus,
  };
}
