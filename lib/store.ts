import { localDateKey } from "./date";
import { computeDrift } from "./drift";
import type { DaemonSnapshot, DaemonState } from "./types";

function defaultState(): DaemonState {
  const today = localDateKey();
  return {
    intentions: {
      sleepHoursPerNight: 8,
      wakeBy: "07:30",
      workoutsPerWeek: 4,
      focusHoursPerDay: 4,
      screenBudgetHoursPerWeek: 7,
    },
    observations: {
      sleepHoursLastNight: 7.5,
      workoutsThisWeek: 2,
      focusHoursToday: 1.5,
      screenHoursThisWeek: 4,
      wakeTimeToday: "07:15",
    },
    policies: {
      autoRescheduleWorkoutIfSleepUnder: 6,
      autoRescheduleWorkout: true,
      autoAdjustWakeAlarm: true,
      enforceFocusBlocks: true,
      extendFocusIfScreenOverBudget: true,
    },
    calendarEvents: [
      {
        id: "ev-morning-focus",
        title: "Focus block",
        date: today,
        startTime: "09:00",
        endTime: "11:00",
        color: "blue",
        source: "user",
      },
      {
        id: "ev-workout",
        title: "Workout",
        date: today,
        startTime: "07:00",
        endTime: "07:45",
        color: "green",
        source: "user",
      },
    ],
    alarms: [
      { id: "a1", hour: 7, minute: 30, enabled: true, label: "Alarm", source: "user" },
      { id: "a2", hour: 5, minute: 0, enabled: false, label: "Alarm", source: "user" },
    ],
    focusMode: {
      active: false,
      label: "Focus",
      until: null,
    },
    interventions: [],
    userDecisionsRequired: 0,
    lastEvent: null,
    objectivesLocked: false,
    workflow: null,
    updatedAt: new Date().toISOString(),
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __daemonState: DaemonState | undefined;
}

export function getState(): DaemonState {
  if (!globalThis.__daemonState) {
    globalThis.__daemonState = defaultState();
  }
  return globalThis.__daemonState;
}

export function replaceState(next: DaemonState): DaemonState {
  globalThis.__daemonState = { ...next, updatedAt: new Date().toISOString() };
  return globalThis.__daemonState;
}

export function patchState(partial: Partial<DaemonState>): DaemonState {
  const current = getState();
  return replaceState({ ...current, ...partial });
}

export function getSnapshot(): DaemonSnapshot {
  const state = getState();
  return {
    ...state,
    metrics: computeDrift(state),
  };
}

export function resetState(): DaemonSnapshot {
  globalThis.__daemonState = defaultState();
  return getSnapshot();
}
