"use client";

import { useDaemonState } from "@/lib/use-daemon-state";
import type { Alarm } from "@/lib/types";

function formatAlarmTime(alarm: Alarm): { time: string; period: string } {
  const h = alarm.hour % 12 || 12;
  const m = String(alarm.minute).padStart(2, "0");
  const period = alarm.hour >= 12 ? "PM" : "AM";
  return { time: `${h}:${m}`, period };
}

function IosSwitch({ on }: { on: boolean }) {
  return (
    <div
      className={`relative h-[31px] w-[51px] rounded-full transition-colors ${
        on ? "bg-[#34c759]" : "bg-[#39393d]"
      }`}
    >
      <div
        className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </div>
  );
}

export default function ClockPage() {
  const { snapshot, loading } = useDaemonState(1500);
  const alarms = [...(snapshot?.alarms ?? [])].sort((a, b) => {
    return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
  });

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-black pb-24 font-[system-ui,-apple-system,BlinkMacSystemFont,'SF_Pro_Display',sans-serif]">
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <button type="button" className="text-[17px] text-[#ff9f0a]">
            Edit
          </button>
          <h1 className="text-[17px] font-semibold">Alarms</h1>
          <button type="button" className="text-[22px] leading-none text-[#ff9f0a]">
            +
          </button>
        </div>
      </header>

      <main className="flex-1 px-4">
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[#8e8e93]">
          {snapshot?.focusMode.active ? "Protected period" : "Other"}
        </p>
        {snapshot?.focusMode.active && (
          <div className="mb-4 rounded-xl bg-[#1c1c1e] px-4 py-3 text-sm text-[#ff9f0a]">
            {snapshot.focusMode.label} enforced
            {snapshot.focusMode.until
              ? ` until ${new Date(snapshot.focusMode.until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : ""}
          </div>
        )}

        {loading && !snapshot ? (
          <p className="py-8 text-center text-[#8e8e93]">Loading…</p>
        ) : (
          <ul className="divide-y divide-[#38383a] rounded-xl bg-black">
            {alarms.map((alarm) => {
              const { time, period } = formatAlarmTime(alarm);
              return (
                <li
                  key={alarm.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div
                      className={`flex items-baseline gap-1 ${
                        alarm.enabled ? "text-white" : "text-[#636366]"
                      }`}
                    >
                      <span className="text-[64px] font-thin leading-none tracking-tight">
                        {time.split(":")[0]}
                      </span>
                      <span className="text-[64px] font-thin leading-none">
                        :{time.split(":")[1]}
                      </span>
                      <span className="text-[22px] font-medium">{period}</span>
                    </div>
                    <p className="text-[15px] text-[#8e8e93]">
                      {alarm.label}
                      {alarm.source === "daemon" ? " · adjusted by DAEMON" : ""}
                    </p>
                  </div>
                  <IosSwitch on={alarm.enabled} />
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#38383a] bg-[#1c1c1e]/95 px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-end justify-between text-[10px] text-[#8e8e93]">
          {[
            { label: "World Clock", active: false },
            { label: "Alarms", active: true },
            { label: "Stopwatch", active: false },
            { label: "Timers", active: false },
          ].map((tab) => (
            <div
              key={tab.label}
              className={`flex flex-col items-center gap-1 pb-1 ${
                tab.active ? "text-[#ff9f0a]" : ""
              }`}
            >
              <span className="text-xl">{tab.active ? "⏰" : "○"}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
