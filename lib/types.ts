export type Domain = "sleep" | "workout" | "focus" | "screen";

export type Intentions = {
  sleepHoursPerNight: number;
  wakeBy: string;
  workoutsPerWeek: number;
  focusHoursPerDay: number;
  screenBudgetHoursPerWeek: number;
};

export type Observations = {
  sleepHoursLastNight: number | null;
  workoutsThisWeek: number;
  focusHoursToday: number;
  screenHoursThisWeek: number;
  wakeTimeToday: string | null;
};

export type Policies = {
  autoRescheduleWorkoutIfSleepUnder: number;
  autoRescheduleWorkout: boolean;
  autoAdjustWakeAlarm: boolean;
  enforceFocusBlocks: boolean;
  extendFocusIfScreenOverBudget: boolean;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  color?: "blue" | "red" | "green" | "orange";
  source?: "user" | "daemon";
};

export type Alarm = {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
  label: string;
  source?: "user" | "daemon";
};

export type FocusMode = {
  active: boolean;
  label: string;
  until: string | null;
};

export type Intervention = {
  id: string;
  at: string;
  type: string;
  summary: string;
  tool: string;
};

export type InjectedEvent =
  | { type: "poor_sleep"; hours: number }
  | { type: "meeting_added"; title: string; startTime: string; endTime: string }
  | { type: "missed_workout" }
  | { type: "screen_over_budget"; hours: number };

export type DaemonState = {
  intentions: Intentions;
  observations: Observations;
  policies: Policies;
  calendarEvents: CalendarEvent[];
  alarms: Alarm[];
  focusMode: FocusMode;
  interventions: Intervention[];
  userDecisionsRequired: number;
  lastEvent: InjectedEvent | null;
  updatedAt: string;
};

export type DriftMetrics = {
  driftPercent: number;
  intentionsExecutedPercent: number;
  domainScores: Record<Domain, number>;
};

export type DaemonSnapshot = DaemonState & {
  metrics: DriftMetrics;
};
