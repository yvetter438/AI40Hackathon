import { localDateKey } from "./date";
import type {
  DaemonState,
  InjectedEvent,
  Intervention,
  WorkflowPhase,
  WorkflowRun,
  WorkflowStep,
} from "./types";

function id(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseWakeMinutes(wakeBy: string): number {
  const [h, m] = wakeBy.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(total: number): { hour: number; minute: number } {
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return { hour, minute };
}

function addIntervention(
  list: Intervention[],
  type: string,
  summary: string,
  tool: string,
): Intervention[] {
  return [
    {
      id: id("int"),
      at: new Date().toISOString(),
      type,
      summary,
      tool,
    },
    ...list,
  ];
}

function step(
  phase: WorkflowPhase,
  title: string,
  detail: string,
  tool?: string,
): Omit<WorkflowStep, "status"> {
  return {
    id: id("step"),
    phase,
    title,
    detail,
    tool,
  };
}

export function planWorkflow(
  state: DaemonState,
  event: InjectedEvent,
): WorkflowStep[] {
  const { policies } = state;
  const steps: Omit<WorkflowStep, "status">[] = [];

  if (event.type === "poor_sleep") {
    steps.push(
      step(
        "observe",
        "Observe sleep",
        `Wearable reported ${event.hours}h sleep (target ${state.intentions.sleepHoursPerNight}h).`,
      ),
      step(
        "reason",
        "Reason about tradeoffs",
        `Sleep below ${policies.autoRescheduleWorkoutIfSleepUnder}h — reconcile wake time, workout, and recovery.`,
      ),
    );
    if (policies.autoAdjustWakeAlarm) {
      steps.push(
        step(
          "act",
          "Adjust wake alarm",
          "Delay wake alarm 45 minutes to protect recovery.",
          "set_alarm",
        ),
      );
    }
    if (policies.autoRescheduleWorkout) {
      steps.push(
        step(
          "act",
          "Reschedule workout",
          "Move morning workout to evening slot.",
          "update_calendar_blocks",
        ),
      );
    }
    if (policies.enforceFocusBlocks) {
      steps.push(
        step(
          "act",
          "Enforce wind-down",
          "Enable protected wind-down period on device.",
          "set_focus_mode",
        ),
      );
    }
    steps.push(
      step(
        "verify",
        "Verify execution",
        "Confirm alarm, calendar, and focus state updated.",
      ),
      step(
        "measure",
        "Measure drift",
        "Recompute drift vs objectives after intervention.",
      ),
    );
  }

  if (event.type === "meeting_added") {
    steps.push(
      step(
        "observe",
        "Observe calendar change",
        `New event: "${event.title}" ${event.startTime}–${event.endTime}.`,
      ),
      step(
        "reason",
        "Reason about conflicts",
        "Shrink focus block; preserve workout and sleep boundaries.",
      ),
      step(
        "act",
        "Update calendar plan",
        "Insert meeting and shorten focus block.",
        "update_calendar_blocks",
      ),
      step("verify", "Verify plan", "Calendar reflects new constraints."),
      step("measure", "Measure drift", "Update drift score."),
    );
  }

  if (event.type === "missed_workout") {
    steps.push(
      step("observe", "Observe missed workout", "Today's workout not completed."),
      step(
        "reason",
        "Find recovery slot",
        "Schedule makeup without violating sleep intention.",
      ),
      step(
        "act",
        "Schedule recovery workout",
        "Book tomorrow 7:00 AM recovery session.",
        "update_calendar_blocks",
      ),
      step("verify", "Verify calendar", "Recovery event on calendar."),
      step("measure", "Measure drift", "Update drift score."),
    );
  }

  if (event.type === "screen_over_budget") {
    steps.push(
      step(
        "observe",
        "Observe screen time",
        `${event.hours}h this week (budget ${state.intentions.screenBudgetHoursPerWeek}h).`,
      ),
      step(
        "reason",
        "Reason about enforcement",
        "Extend focus protection to stop drift.",
      ),
    );
    if (policies.extendFocusIfScreenOverBudget) {
      steps.push(
        step(
          "act",
          "Extend focus mode",
          "Block distractions for 60 minutes.",
          "set_focus_mode",
        ),
      );
    }
    steps.push(
      step("verify", "Verify enforcement", "Focus mode active on device."),
      step("measure", "Measure drift", "Update drift score."),
    );
  }

  return steps.map((s) => ({ ...s, status: "pending" as const }));
}

export function startWorkflow(
  state: DaemonState,
  event: InjectedEvent,
  lockObjectives: boolean,
): DaemonState {
  return {
    ...state,
    lastEvent: event,
    objectivesLocked: lockObjectives,
    workflow: {
      phase: "armed",
      event,
      steps: planWorkflow(state, event),
      startedAt: null,
      completedAt: null,
    },
  };
}

export function beginRunning(state: DaemonState): DaemonState {
  if (!state.workflow) return state;
  return {
    ...state,
    workflow: {
      ...state.workflow,
      phase: "running",
      startedAt: state.workflow.startedAt ?? new Date().toISOString(),
    },
  };
}

type ExecuteResult = {
  state: DaemonState;
  ok: boolean;
  message: string;
};

function findStep(state: DaemonState, stepId: string): WorkflowStep | undefined {
  return state.workflow?.steps.find((s) => s.id === stepId);
}

function markStepDone(state: DaemonState, stepId: string): DaemonState {
  if (!state.workflow) return state;
  const steps = state.workflow.steps.map((s) =>
    s.id === stepId ? { ...s, status: "done" as const } : s,
  );
  const allDone = steps.every((s) => s.status === "done");
  return {
    ...state,
    workflow: {
      ...state.workflow,
      steps,
      phase: allDone ? "complete" : state.workflow.phase,
      completedAt: allDone ? new Date().toISOString() : state.workflow.completedAt,
    },
  };
}

function executePoorSleepAct(
  state: DaemonState,
  event: Extract<InjectedEvent, { type: "poor_sleep" }>,
  tool: string,
): DaemonState {
  let calendarEvents = [...state.calendarEvents];
  let alarms = [...state.alarms];
  let focusMode = { ...state.focusMode };
  let interventions = [...state.interventions];
  const observations = {
    ...state.observations,
    sleepHoursLastNight: event.hours,
  };

  if (tool === "set_alarm") {
    const wakeMinutes = parseWakeMinutes(state.intentions.wakeBy);
    const newWake = minutesToTime(wakeMinutes + 45);
    alarms = alarms.map((a) =>
      a.enabled && a.label === "Alarm"
        ? {
            ...a,
            hour: newWake.hour,
            minute: newWake.minute,
            source: "daemon" as const,
          }
        : a,
    );
    interventions = addIntervention(
      interventions,
      "sleep_recovery",
      `Wake alarm delayed to ${String(newWake.hour).padStart(2, "0")}:${String(newWake.minute).padStart(2, "0")}.`,
      "set_alarm",
    );
  }

  if (tool === "update_calendar_blocks") {
    calendarEvents = calendarEvents.map((ev) =>
      ev.title === "Workout" && ev.date === localDateKey()
        ? {
            ...ev,
            startTime: "18:30",
            endTime: "19:15",
            source: "daemon" as const,
          }
        : ev,
    );
    interventions = addIntervention(
      interventions,
      "reschedule",
      "Morning workout moved to 6:30 PM.",
      "update_calendar_blocks",
    );
  }

  if (tool === "set_focus_mode") {
    focusMode = {
      active: true,
      label: "Wind-down",
      until: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    };
    interventions = addIntervention(
      interventions,
      "enforce",
      "Wind-down period enabled for 45 minutes.",
      "set_focus_mode",
    );
  }

  return {
    ...state,
    observations,
    calendarEvents,
    alarms,
    focusMode,
    interventions,
  };
}

export function executeWorkflowStep(
  state: DaemonState,
  stepId: string,
): ExecuteResult {
  const wf = state.workflow;
  const stepDef = findStep(state, stepId);
  if (!wf || !stepDef) {
    return { state, ok: false, message: "Step not found." };
  }
  if (stepDef.status === "done") {
    return { state, ok: true, message: "Step already completed." };
  }

  const event = wf.event;
  let next = { ...state };

  if (stepDef.phase === "observe") {
    if (event.type === "poor_sleep") {
      next.observations = {
        ...next.observations,
        sleepHoursLastNight: event.hours,
      };
    }
    if (event.type === "screen_over_budget") {
      next.observations = {
        ...next.observations,
        screenHoursThisWeek: event.hours,
      };
    }
  }

  if (stepDef.phase === "act" && stepDef.tool) {
    if (event.type === "poor_sleep") {
      next = executePoorSleepAct(next, event, stepDef.tool);
    }
    if (event.type === "meeting_added" && stepDef.tool === "update_calendar_blocks") {
      const today = localDateKey();
      const meeting = {
        id: id("ev"),
        title: event.title,
        date: today,
        startTime: event.startTime,
        endTime: event.endTime,
        color: "orange" as const,
        source: "daemon" as const,
      };
      next.calendarEvents = [...next.calendarEvents, meeting].map((ev) =>
        ev.title === "Focus block"
          ? { ...ev, endTime: "10:00", source: "daemon" as const }
          : ev,
      );
      next.interventions = addIntervention(
        next.interventions,
        "plan",
        `Meeting "${event.title}" added; focus shortened.`,
        "update_calendar_blocks",
      );
    }
    if (event.type === "missed_workout" && stepDef.tool === "update_calendar_blocks") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      next.calendarEvents = [
        ...next.calendarEvents,
        {
          id: id("ev"),
          title: "Workout (recovery)",
          date: localDateKey(tomorrow),
          startTime: "07:00",
          endTime: "07:45",
          color: "green",
          source: "daemon",
        },
      ];
      next.interventions = addIntervention(
        next.interventions,
        "recover",
        "Recovery workout scheduled tomorrow 7:00 AM.",
        "update_calendar_blocks",
      );
    }
    if (
      event.type === "screen_over_budget" &&
      stepDef.tool === "set_focus_mode"
    ) {
      next.focusMode = {
        active: true,
        label: "Focus",
        until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      next.interventions = addIntervention(
        next.interventions,
        "enforce",
        "Focus enforcement extended 60 minutes.",
        "set_focus_mode",
      );
    }
  }

  next = markStepDone(next, stepId);
  if (!next.workflow) {
    return { state: next, ok: true, message: stepDef.title };
  }

  next = beginRunning(next);

  return {
    state: next,
    ok: true,
    message: `${stepDef.phase.toUpperCase()}: ${stepDef.title}`,
  };
}

export function executeAllPendingSteps(state: DaemonState): ExecuteResult {
  if (!state.workflow) {
    return { state, ok: false, message: "No active workflow." };
  }
  let current = beginRunning(state);
  const pending = current.workflow!.steps.filter((s) => s.status === "pending");
  for (const s of pending) {
    const result = executeWorkflowStep(current, s.id);
    current = result.state;
  }
  return {
    state: current,
    ok: true,
    message: `Completed ${pending.length} steps.`,
  };
}

export function clearWorkflow(state: DaemonState): DaemonState {
  return {
    ...state,
    workflow: null,
    objectivesLocked: false,
  };
}

export const DEMO_SCENARIOS: { label: string; event: InjectedEvent }[] = [
  { label: "Poor sleep (5.5h)", event: { type: "poor_sleep", hours: 5.5 } },
  {
    label: "New meeting 2–3 PM",
    event: {
      type: "meeting_added",
      title: "Investor sync",
      startTime: "14:00",
      endTime: "15:00",
    },
  },
  { label: "Missed workout", event: { type: "missed_workout" } },
  {
    label: "Screen over budget",
    event: { type: "screen_over_budget", hours: 9 },
  },
];
