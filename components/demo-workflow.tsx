"use client";

import { DEMO_SCENARIOS } from "@/lib/workflow";
import type { Intentions, InjectedEvent, WorkflowStep } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const PHASE_COLORS: Record<string, string> = {
  observe: "border-sky-500/50 bg-sky-500/10 text-sky-300",
  reason: "border-violet-500/50 bg-violet-500/10 text-violet-300",
  act: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  verify: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  measure: "border-zinc-500/50 bg-zinc-500/10 text-zinc-300",
};

type Props = {
  intentions: Intentions;
  objectivesLocked: boolean;
  workflow: {
    phase: string;
    event: InjectedEvent;
    steps: WorkflowStep[];
  } | null;
  busy: boolean;
  onSaveObjectives: (intentions: Intentions) => Promise<void>;
  onArmScenario: (event: InjectedEvent, intentions: Intentions) => Promise<void>;
  onStartRun: () => Promise<void>;
  onRunStep: (stepId: string) => Promise<void>;
  onRunAll: () => Promise<void>;
  onClear: () => Promise<void>;
};

export function DemoWorkflow({
  intentions,
  objectivesLocked,
  workflow,
  busy,
  onSaveObjectives,
  onArmScenario,
  onStartRun,
  onRunStep,
  onRunAll,
  onClear,
}: Props) {
  const [draft, setDraft] = useState(intentions);
  const [scenarioIndex, setScenarioIndex] = useState(0);

  useEffect(() => {
    setDraft(intentions);
  }, [intentions]);

  const wizardStep = !objectivesLocked ? 1 : !workflow ? 2 : 3;
  const nextPending = workflow?.steps.find((s) => s.status === "pending");

  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-zinc-950/80 p-6 lg:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-500/80">
            Demo workflow
          </p>
          <h2 className="text-xl font-semibold">
            Objectives → Run → Simulate agent loop
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Set what matters, arm a life event, then click through each phase
            (Observe → Reason → Act → Verify → Measure) like DAEMON executing
            on your behalf.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`rounded-full px-3 py-1 font-medium ${
                wizardStep === n
                  ? "bg-emerald-600 text-white"
                  : wizardStep > n
                    ? "bg-emerald-900/60 text-emerald-300"
                    : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {n === 1 ? "Objectives" : n === 2 ? "Arm" : "Run loop"}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="font-medium">1 · Set objectives</h3>
          <div className="grid gap-3 text-sm">
            <Field
              label="Sleep (h/night)"
              type="number"
              step="0.5"
              value={draft.sleepHoursPerNight}
              onChange={(v) =>
                setDraft({ ...draft, sleepHoursPerNight: Number(v) })
              }
              disabled={objectivesLocked && !!workflow}
            />
            <Field
              label="Wake by"
              type="time"
              value={draft.wakeBy}
              onChange={(v) => setDraft({ ...draft, wakeBy: v })}
              disabled={objectivesLocked && !!workflow}
            />
            <Field
              label="Workouts / week"
              type="number"
              value={draft.workoutsPerWeek}
              onChange={(v) =>
                setDraft({ ...draft, workoutsPerWeek: Number(v) })
              }
              disabled={objectivesLocked && !!workflow}
            />
            <Field
              label="Focus (h/day)"
              type="number"
              step="0.5"
              value={draft.focusHoursPerDay}
              onChange={(v) =>
                setDraft({ ...draft, focusHoursPerDay: Number(v) })
              }
              disabled={objectivesLocked && !!workflow}
            />
            <Field
              label="Screen budget (h/week)"
              type="number"
              value={draft.screenBudgetHoursPerWeek}
              onChange={(v) =>
                setDraft({ ...draft, screenBudgetHoursPerWeek: Number(v) })
              }
              disabled={objectivesLocked && !!workflow}
            />
          </div>
          <button
            type="button"
            disabled={busy || (objectivesLocked && !!workflow)}
            onClick={() => onSaveObjectives(draft)}
            className="w-full rounded-xl bg-zinc-800 py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50"
          >
            Save objectives
          </button>
        </div>

        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="font-medium">2 · Arm scenario</h3>
          <p className="text-sm text-zinc-400">
            Pick an unexpected event DAEMON should handle autonomously.
          </p>
          <select
            value={scenarioIndex}
            onChange={(e) => setScenarioIndex(Number(e.target.value))}
            disabled={busy || !objectivesLocked}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm disabled:opacity-50"
          >
            {DEMO_SCENARIOS.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !objectivesLocked}
            onClick={() =>
              onArmScenario(DEMO_SCENARIOS[scenarioIndex].event, draft)
            }
            className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
          >
            Plan workflow
          </button>
          {workflow && (
            <p className="text-xs text-emerald-400">
              Armed: {DEMO_SCENARIOS.find((s) => s.event.type === workflow.event.type)?.label ?? "scenario"} ·{" "}
              {workflow.steps.length} steps
            </p>
          )}
        </div>

        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="font-medium">3 · Run & simulate</h3>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={busy || !workflow}
              onClick={() => onStartRun()}
              className="rounded-xl bg-emerald-600 py-2.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              Start DAEMON loop
            </button>
            <button
              type="button"
              disabled={busy || !nextPending}
              onClick={() => nextPending && onRunStep(nextPending.id)}
              className="rounded-xl border border-emerald-600/50 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-950 disabled:opacity-50"
            >
              {nextPending
                ? `Simulate next: ${nextPending.title}`
                : "All steps complete"}
            </button>
            <button
              type="button"
              disabled={busy || !workflow?.steps.some((s) => s.status === "pending")}
              onClick={() => onRunAll()}
              className="rounded-xl bg-zinc-800 py-2 text-sm hover:bg-zinc-700 disabled:opacity-50"
            >
              Run all steps (auto)
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onClear()}
              className="rounded-xl py-2 text-sm text-zinc-500 hover:text-zinc-300"
            >
              Reset workflow
            </button>
          </div>
          {workflow?.phase === "complete" && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              Loop complete. Open{" "}
              <Link href="/clock" className="underline">
                Clock
              </Link>{" "}
              and{" "}
              <Link href="/calendar" className="underline">
                Calendar
              </Link>{" "}
              to see changes.
            </div>
          )}
        </div>
      </div>

      {workflow && workflow.steps.length > 0 && (
        <ol className="mt-6 space-y-2">
          {workflow.steps.map((s, i) => (
            <li
              key={s.id}
              className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
                s.status === "done"
                  ? "border-zinc-800 bg-zinc-900/30 opacity-80"
                  : nextPending?.id === s.id
                    ? "border-emerald-500/60 bg-emerald-950/30"
                    : "border-zinc-800 bg-zinc-950/40"
              }`}
            >
              <span className="w-6 text-center text-xs text-zinc-500">
                {i + 1}
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${PHASE_COLORS[s.phase]}`}
              >
                {s.phase}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-100">{s.title}</p>
                <p className="text-sm text-zinc-400">{s.detail}</p>
              </div>
              {s.tool && (
                <code className="text-xs text-emerald-400">{s.tool}</code>
              )}
              {s.status === "done" ? (
                <span className="text-xs text-zinc-500">Done</span>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRunStep(s.id)}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium hover:bg-zinc-700 disabled:opacity-50"
                >
                  Simulate
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  step,
  disabled,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        type={type ?? "text"}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 disabled:opacity-50"
      />
    </label>
  );
}
