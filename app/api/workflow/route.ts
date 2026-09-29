import {
  beginRunning,
  clearWorkflow,
  executeAllPendingSteps,
  executeWorkflowStep,
  startWorkflow,
} from "@/lib/workflow";
import { getSnapshot, replaceState } from "@/lib/store";
import type { InjectedEvent, Intentions } from "@/lib/types";
import { NextResponse } from "next/server";

type Body =
  | { action: "start"; event: InjectedEvent; intentions?: Intentions }
  | { action: "run" }
  | { action: "step"; stepId: string }
  | { action: "run_all" }
  | { action: "clear" };

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  if (body.action === "start") {
    const current = getSnapshot();
    if (body.intentions) {
      replaceState({ ...current, intentions: body.intentions });
    }
    replaceState(startWorkflow(getSnapshot(), body.event, true));
    return NextResponse.json(getSnapshot());
  }

  const state = getSnapshot();

  if (body.action === "run") {
    if (!state.workflow) {
      return NextResponse.json(
        { error: "Arm a scenario first." },
        { status: 400 },
      );
    }
    replaceState(beginRunning(state));
    return NextResponse.json(getSnapshot());
  }

  if (body.action === "step") {
    const result = executeWorkflowStep(state, body.stepId);
    replaceState(result.state);
    return NextResponse.json({ ...getSnapshot(), stepMessage: result.message });
  }

  if (body.action === "run_all") {
    const result = executeAllPendingSteps(state);
    replaceState(result.state);
    return NextResponse.json({ ...getSnapshot(), stepMessage: result.message });
  }

  if (body.action === "clear") {
    replaceState(clearWorkflow(state));
    return NextResponse.json(getSnapshot());
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
