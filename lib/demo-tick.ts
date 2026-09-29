import { localDateKey } from "./date";
import { getState, replaceState } from "./store";
import type { InjectedEvent, Intervention } from "./types";

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

export type TickResult = {
  ok: boolean;
  message: string;
  toolsInvoked: string[];
};

export function runDemoTick(event?: InjectedEvent | null): TickResult {
  const state = getState();
  const toolsInvoked: string[] = [];
  let interventions = [...state.interventions];
  let calendarEvents = [...state.calendarEvents];
  let alarms = [...state.alarms];
  let focusMode = { ...state.focusMode };
  const observations = { ...state.observations };
  const policies = state.policies;
  const trigger = event ?? state.lastEvent;

  if (!trigger) {
    return {
      ok: false,
      message: "No event to respond to. Inject an event first.",
      toolsInvoked,
    };
  }

  if (trigger.type === "poor_sleep") {
    observations.sleepHoursLastNight = trigger.hours;

    if (
      policies.autoAdjustWakeAlarm &&
      trigger.hours < policies.autoRescheduleWorkoutIfSleepUnder
    ) {
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
      toolsInvoked.push("set_alarm");
      interventions = addIntervention(
        interventions,
        "sleep_recovery",
        `Poor sleep (${trigger.hours}h). Wake alarm delayed 45m to ${String(newWake.hour).padStart(2, "0")}:${String(newWake.minute).padStart(2, "0")}.`,
        "set_alarm",
      );
    }

    if (
      policies.autoRescheduleWorkout &&
      trigger.hours < policies.autoRescheduleWorkoutIfSleepUnder
    ) {
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
      toolsInvoked.push("update_calendar_blocks");
      interventions = addIntervention(
        interventions,
        "reschedule",
        "Morning workout moved to 6:30 PM after short sleep.",
        "update_calendar_blocks",
      );
    }

    if (policies.enforceFocusBlocks) {
      focusMode = {
        active: true,
        label: "Wind-down",
        until: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      };
      toolsInvoked.push("set_focus_mode");
      interventions = addIntervention(
        interventions,
        "enforce",
        "Protected wind-down period enabled for 45 minutes.",
        "set_focus_mode",
      );
    }
  }

  if (trigger.type === "meeting_added") {
    const today = localDateKey();
    calendarEvents.push({
      id: id("ev"),
      title: trigger.title,
      date: today,
      startTime: trigger.startTime,
      endTime: trigger.endTime,
      color: "orange",
      source: "daemon",
    });
    toolsInvoked.push("update_calendar_blocks");
    interventions = addIntervention(
      interventions,
      "plan",
      `Calendar conflict handled: "${trigger.title}" ${trigger.startTime}–${trigger.endTime}. Focus block shortened in plan.`,
      "update_calendar_blocks",
    );

    calendarEvents = calendarEvents.map((ev) =>
      ev.title === "Focus block"
        ? { ...ev, endTime: "10:00", source: "daemon" as const }
        : ev,
    );
  }

  if (trigger.type === "missed_workout") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = localDateKey(tomorrow);
    calendarEvents.push({
      id: id("ev"),
      title: "Workout (recovery)",
      date,
      startTime: "07:00",
      endTime: "07:45",
      color: "green",
      source: "daemon",
    });
    toolsInvoked.push("update_calendar_blocks");
    interventions = addIntervention(
      interventions,
      "recover",
      "Missed workout detected. Recovery slot scheduled tomorrow 7:00 AM.",
      "update_calendar_blocks",
    );
  }

  if (trigger.type === "screen_over_budget") {
    observations.screenHoursThisWeek = trigger.hours;
    if (policies.extendFocusIfScreenOverBudget) {
      focusMode = {
        active: true,
        label: "Focus",
        until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      toolsInvoked.push("set_focus_mode");
      interventions = addIntervention(
        interventions,
        "enforce",
        `Screen budget exceeded (${trigger.hours}h). Focus enforcement extended 60 minutes.`,
        "set_focus_mode",
      );
    }
  }

  replaceState({
    ...state,
    observations,
    calendarEvents,
    alarms,
    focusMode,
    interventions,
    lastEvent: trigger,
  });

  return {
    ok: true,
    message: `DAEMON completed loop (${toolsInvoked.length} tools).`,
    toolsInvoked,
  };
}
