"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  DaemonSnapshot,
  DaemonState,
  InjectedEvent,
  Intentions,
} from "./types";

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

  const workflowPost = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSnapshot(data as DaemonSnapshot);
    return data;
  }, []);

  const saveObjectives = useCallback(
    async (intentions: Intentions) => {
      return patch({ intentions, objectivesLocked: true });
    },
    [patch],
  );

  const armWorkflow = useCallback(
    async (event: InjectedEvent, intentions: Intentions) => {
      return workflowPost({ action: "start", event, intentions });
    },
    [workflowPost],
  );

  const startWorkflowRun = useCallback(async () => {
    return workflowPost({ action: "run" });
  }, [workflowPost]);

  const runWorkflowStep = useCallback(
    async (stepId: string) => {
      return workflowPost({ action: "step", stepId });
    },
    [workflowPost],
  );

  const runWorkflowAll = useCallback(async () => {
    return workflowPost({ action: "run_all" });
  }, [workflowPost]);

  const clearWorkflow = useCallback(async () => {
    return workflowPost({ action: "clear" });
  }, [workflowPost]);

  return {
    snapshot,
    loading,
    error,
    refresh,
    patch,
    injectEvent,
    runTick,
    saveObjectives,
    armWorkflow,
    startWorkflowRun,
    runWorkflowStep,
    runWorkflowAll,
    clearWorkflow,
  };
}
