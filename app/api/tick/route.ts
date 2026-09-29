import { runDemoTick } from "@/lib/demo-tick";
import { getSnapshot } from "@/lib/store";
import { NextResponse } from "next/server";

export async function POST() {
  const tick = runDemoTick();
  return NextResponse.json({
    ...getSnapshot(),
    tick,
  });
}
