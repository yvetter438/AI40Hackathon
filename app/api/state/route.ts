import { getSnapshot, patchState, resetState } from "@/lib/store";
import type { DaemonState } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getSnapshot());
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Partial<DaemonState> & {
    reset?: boolean;
  };

  if (body.reset) {
    return NextResponse.json(resetState());
  }

  const { reset: _reset, ...partial } = body;
  patchState(partial);
  return NextResponse.json(getSnapshot());
}
