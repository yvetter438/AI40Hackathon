"use client";

import { DemoWorkflow } from "@/components/demo-workflow";
import { useDaemonState } from "@/lib/use-daemon-state";
import type { Policies } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

export default function DashboardPage() {
  const {
    snapshot,
    loading,
    error,
    patch,
    injectEvent,
    runTick,
    saveObjectives,
    armWorkflow,
    startWorkflowRun,
    runWorkflowStep,
    runWorkflowAll,
    clearWorkflow,
  } = useDaemonState(2000);
  const [busy, setBusy] = useState(false);

  async function withBusy(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  if (loading && !snapshot) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b0b0f] text-zinc-400">
        Loading DAEMON…
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b0b0f] text-red-400">
        {error ?? "Failed to load"}
      </div>
    );
  }

  const { metrics, intentions, observations, policies, interventions } =
    snapshot;

  function updatePolicies(next: Partial<Policies>) {
    void patch({ policies: { ...policies, ...next } });
  }

  return (
    <div className="min-h-dvh bg-[#0b0b0f] text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Autonomous operator
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">DAEMON</h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Human governs objectives. DAEMON governs execution.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href="/calendar"
              className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-900"
            >
              Open Calendar PWA
            </Link>
            <Link
              href="/clock"
              className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-900"
            >
              Open Clock PWA
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-3">
        <DemoWorkflow
          intentions={intentions}
          objectivesLocked={snapshot.objectivesLocked}
          workflow={snapshot.workflow}
          busy={busy}
          onSaveObjectives={(i) => withBusy(() => saveObjectives(i))}
          onArmScenario={(event, i) => withBusy(() => armWorkflow(event, i))}
          onStartRun={() => withBusy(() => startWorkflowRun())}
          onRunStep={(id) => withBusy(() => runWorkflowStep(id))}
          onRunAll={() => withBusy(() => runWorkflowAll())}
          onClear={() => withBusy(() => clearWorkflow())}
        />

        <section className="lg:col-span-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Drift" value={`${metrics.driftPercent}%`} accent />
          <MetricCard
            label="Intentions executed"
            value={`${metrics.intentionsExecutedPercent}%`}
          />
          <MetricCard
            label="Autonomous interventions"
            value={String(interventions.length)}
          />
          <MetricCard
            label="User decisions required"
            value={String(snapshot.userDecisionsRequired)}
          />
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 lg:col-span-2">
          <h2 className="text-lg font-medium">Delegated authority</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Policies define what DAEMON may do without asking.
          </p>
          <div className="mt-4 space-y-3">
            <PolicyToggle
              label="Auto-reschedule workout after poor sleep"
              checked={policies.autoRescheduleWorkout}
              onChange={(v) => updatePolicies({ autoRescheduleWorkout: v })}
            />
            <PolicyToggle
              label="Auto-adjust wake alarm"
              checked={policies.autoAdjustWakeAlarm}
              onChange={(v) => updatePolicies({ autoAdjustWakeAlarm: v })}
            />
            <PolicyToggle
              label="Enforce focus / wind-down blocks"
              checked={policies.enforceFocusBlocks}
              onChange={(v) => updatePolicies({ enforceFocusBlocks: v })}
            />
            <PolicyToggle
              label="Extend focus if screen budget exceeded"
              checked={policies.extendFocusIfScreenOverBudget}
              onChange={(v) =>
                updatePolicies({ extendFocusIfScreenOverBudget: v })
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <h2 className="text-lg font-medium">Quick inject (legacy)</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Runs full loop instantly — use the guided workflow above for demos.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <ActionButton
              disabled={busy}
              onClick={() =>
                withBusy(() =>
                  injectEvent({ type: "poor_sleep", hours: 5.5 }),
                )
              }
            >
              Poor sleep (5.5h)
            </ActionButton>
            <ActionButton
              disabled={busy}
              onClick={() =>
                withBusy(() =>
                  injectEvent({
                    type: "meeting_added",
                    title: "Investor sync",
                    startTime: "14:00",
                    endTime: "15:00",
                  }),
                )
              }
            >
              New meeting 2–3 PM
            </ActionButton>
            <ActionButton
              disabled={busy}
              onClick={() =>
                withBusy(() => injectEvent({ type: "missed_workout" }))
              }
            >
              Missed workout
            </ActionButton>
            <ActionButton
              disabled={busy}
              onClick={() =>
                withBusy(() =>
                  injectEvent({ type: "screen_over_budget", hours: 9 }),
                )
              }
            >
              Screen time over budget
            </ActionButton>
            <ActionButton
              disabled={busy}
              variant="secondary"
              onClick={() => withBusy(() => runTick())}
            >
              Re-run tick on last event
            </ActionButton>
            <ActionButton
              disabled={busy}
              variant="ghost"
              onClick={() => withBusy(() => patch({ reset: true }))}
            >
              Reset demo state
            </ActionButton>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 lg:col-span-2">
          <h2 className="text-lg font-medium">Live state</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div className="space-y-2 rounded-xl bg-zinc-900/50 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Observed
              </p>
              <ul className="space-y-1 text-zinc-300">
                <li>
                  Sleep last night:{" "}
                  {observations.sleepHoursLastNight ?? "—"}h
                </li>
                <li>Workouts this week: {observations.workoutsThisWeek}</li>
                <li>Focus today: {observations.focusHoursToday}h</li>
                <li>Screen this week: {observations.screenHoursThisWeek}h</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            {(Object.keys(metrics.domainScores) as Array<keyof typeof metrics.domainScores>).map(
              (d) => (
                <div key={d} className="rounded-lg bg-zinc-900/60 p-2">
                  <p className="uppercase text-zinc-500">{d}</p>
                  <p className="text-lg font-medium text-zinc-100">
                    {Math.round(metrics.domainScores[d] * 100)}%
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <h2 className="text-lg font-medium">Tool interface</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Latest autonomous actions (audit log).
          </p>
          <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto text-sm">
            {interventions.length === 0 ? (
              <li className="text-zinc-500">No interventions yet.</li>
            ) : (
              interventions.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-emerald-400">
                      {item.tool}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(item.at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 text-zinc-200">{item.summary}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/40 p-5 lg:col-span-3">
          <h2 className="text-lg font-medium">Add to Home Screen (iPhone)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            <li>
              Open{" "}
              <Link href="/calendar" className="text-zinc-200 underline">
                /calendar
              </Link>{" "}
              in Safari → Share → <strong className="text-zinc-200">Add to Home Screen</strong> → name should show as{" "}
              <strong className="text-zinc-200">Calendar</strong>.
            </li>
            <li>
              Open{" "}
              <Link href="/clock" className="text-zinc-200 underline">
                /clock
              </Link>{" "}
              the same way → icon/name <strong className="text-zinc-200">Clock</strong>.
            </li>
            <li>
              Run an inject event here, then switch to those apps — plan updates
              poll every ~1.5s.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-zinc-800 bg-zinc-950/80"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function PolicyToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-zinc-900/50 px-3 py-3 text-sm">
      <span className="text-zinc-300">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-emerald-500"
      />
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
      : variant === "secondary"
        ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
        : "bg-transparent hover:bg-zinc-900 text-zinc-400 border border-zinc-800";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}
