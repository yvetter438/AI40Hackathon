"use client";

import { localDateKey } from "@/lib/date";
import { useDaemonState } from "@/lib/use-daemon-state";
import type { CalendarEvent } from "@/lib/types";
import { useMemo } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function monthMatrix(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(first.getDay()).fill(null);

  for (let day = 1; day <= last.getDate(); day++) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function eventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const key = localDateKey(date);
  return events.filter((e) => e.date === key);
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long" });
}

export default function CalendarPage() {
  const { snapshot, loading } = useDaemonState(1500);
  const viewDate = useMemo(() => new Date(), []);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = useMemo(() => monthMatrix(year, month), [year, month]);
  const todayKey = localDateKey(viewDate);
  const events = snapshot?.calendarEvents ?? [];

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-white pb-24 font-[system-ui,-apple-system,BlinkMacSystemFont,'SF_Pro_Text',sans-serif]">
      <header className="sticky top-0 z-10 bg-white/95 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-center justify-between text-[#ff3b30]">
          <button type="button" className="text-[17px] font-normal">
            ‹ {year}
          </button>
          <div className="flex items-center gap-3 rounded-full bg-[#f2f2f7] px-3 py-1.5 text-[#007aff]">
            <span className="text-lg leading-none">☰</span>
            <span className="text-lg leading-none">⌕</span>
            <span className="text-xl leading-none">+</span>
          </div>
        </div>
        <h1 className="mt-2 text-[34px] font-bold tracking-tight text-black">
          {formatMonthYear(viewDate)}
        </h1>
        <div className="mt-3 grid grid-cols-7 text-center text-[13px] font-medium text-[#8e8e93]">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
      </header>

      <main className="flex-1 px-2">
        {loading && !snapshot ? (
          <p className="px-2 py-8 text-center text-[#8e8e93]">Loading…</p>
        ) : (
          weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-t border-[#e5e5ea]">
              {week.map((date, di) => {
                if (!date) {
                  return <div key={di} className="min-h-[74px]" />;
                }
                const key = localDateKey(date);
                const isToday = key === todayKey;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const dayEvents = eventsForDay(events, date);

                return (
                  <div key={di} className="min-h-[74px] border-r border-[#f2f2f7] px-0.5 py-1 last:border-r-0">
                    <div className="flex justify-center">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[17px] ${
                          isToday
                            ? "bg-[#ff3b30] font-semibold text-white"
                            : isWeekend
                              ? "font-semibold text-[#8e8e93]"
                              : "font-semibold text-black"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`truncate rounded px-1 text-[10px] leading-tight ${
                            ev.source === "daemon"
                              ? "bg-[#007aff]/15 text-[#007aff]"
                              : "bg-[#34c759]/15 text-[#248a3d]"
                          }`}
                        >
                          {ev.startTime ? `${ev.startTime} ` : ""}
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-[#e5e5ea] bg-[#f9f9f9]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-[17px] shadow-sm"
          >
            Today
          </button>
          <div className="flex gap-4 text-[#007aff]">
            <span className="text-xl">▦</span>
            <span className="text-xl">📥</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
