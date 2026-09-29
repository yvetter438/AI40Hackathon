import type { DaemonState, DriftMetrics, Domain } from "./types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function computeDrift(state: DaemonState): DriftMetrics {
  const { intentions, observations } = state;

  const sleepTarget = intentions.sleepHoursPerNight;
  const sleepActual = observations.sleepHoursLastNight ?? sleepTarget;
  const sleepScore = clamp01(sleepActual / sleepTarget);

  const workoutTarget = Math.min(intentions.workoutsPerWeek, 7);
  const workoutScore = clamp01(
    observations.workoutsThisWeek / Math.max(workoutTarget, 1),
  );

  const focusScore = clamp01(
    observations.focusHoursToday / Math.max(intentions.focusHoursPerDay, 0.1),
  );

  const screenUsed = observations.screenHoursThisWeek;
  const screenBudget = Math.max(intentions.screenBudgetHoursPerWeek, 0.1);
  const screenScore = clamp01(1 - screenUsed / screenBudget);

  const domainScores: Record<Domain, number> = {
    sleep: sleepScore,
    workout: workoutScore,
    focus: focusScore,
    screen: screenScore,
  };

  const weights: Record<Domain, number> = {
    sleep: 0.3,
    workout: 0.25,
    focus: 0.3,
    screen: 0.15,
  };

  const executed =
    domainScores.sleep * weights.sleep +
    domainScores.workout * weights.workout +
    domainScores.focus * weights.focus +
    domainScores.screen * weights.screen;

  const intentionsExecutedPercent = Math.round(executed * 100);
  const driftPercent = Math.round((1 - executed) * 100);

  return {
    driftPercent,
    intentionsExecutedPercent,
    domainScores,
  };
}
