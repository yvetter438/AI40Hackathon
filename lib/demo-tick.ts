import { executeAllPendingSteps, startWorkflow } from "./workflow";
import { getState, replaceState } from "./store";
import type { InjectedEvent } from "./types";

export type TickResult = {
  ok: boolean;
  message: string;
  toolsInvoked: string[];
};

export function runDemoTick(event?: InjectedEvent | null): TickResult {
  const state = getState();
  const trigger = event ?? state.lastEvent;

  if (!trigger) {
    return {
      ok: false,
      message: "No event to respond to. Inject an event first.",
      toolsInvoked: [],
    };
  }

  let next = startWorkflow(state, trigger, state.objectivesLocked);
  next = executeAllPendingSteps(next).state;
  replaceState(next);

  const toolsInvoked =
    next.workflow?.steps
      .filter((s) => s.tool && s.status === "done")
      .map((s) => s.tool!) ?? [];

  return {
    ok: true,
    message: `DAEMON completed loop (${toolsInvoked.length} tools).`,
    toolsInvoked,
  };
}
