import { runDemoTick } from "@/lib/demo-tick";
import { getSnapshot, patchState } from "@/lib/store";
import type { InjectedEvent } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const event = (await request.json()) as InjectedEvent;
  patchState({ lastEvent: event });
  const tick = runDemoTick(event);
  return NextResponse.json({
    ...getSnapshot(),
    tick,
  });
}
