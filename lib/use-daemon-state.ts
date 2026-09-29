"use client";

import { useCallback, useEffect, useState } from "react";
import type { DaemonSnapshot, DaemonState, InjectedEvent } from "./types";

export function useDaemonState(pollMs = 2000) {
  const [snapshot, setSnapshot] = useState<DaemonSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load state");
      const data = (await res.json()) as DaemonSnapshot;
      setSnapshot(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  const patch = useCallback(
    async (partial: Partial<DaemonState> & { reset?: boolean }) => {
      const res = await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const data = (await res.json()) as DaemonSnapshot;
      setSnapshot(data);
      return data;
    },
    [],
  );

  const injectEvent = useCallback(async (event: InjectedEvent) => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const data = await res.json();
    setSnapshot(data as DaemonSnapshot);
    return data;
  }, []);

  const runTick = useCallback(async () => {
    const res = await fetch("/api/tick", { method: "POST" });
    const data = await res.json();
    setSnapshot(data as DaemonSnapshot);
    return data;
  }, []);

  return {
    snapshot,
    loading,
    error,
    refresh,
    patch,
    injectEvent,
    runTick,
  };
}
