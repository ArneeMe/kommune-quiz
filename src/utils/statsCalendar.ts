// src/utils/statsCalendar.ts
// Derives a Monday-first week grid from the stored daily history,
// for the results calendar in the stats overlay.

import { formatDateKey } from "./seededRandom";
import type { DaySnapshot } from "./dailyStorage";

export type CalendarDayState = "perfect" | "complete" | "partial" | "poor" | "none" | "future";

export interface CalendarDay {
    dateKey: string;
    dayOfMonth: number;
    state: CalendarDayState;
    isToday: boolean;
}

function classify(snapshot: DaySnapshot | undefined): CalendarDayState {
    if (!snapshot) return "none";
    const total = snapshot.results.length;
    if (snapshot.correctCount === total && snapshot.totalErrors === 0) return "perfect";
    if (snapshot.correctCount === total) return "complete";
    if (snapshot.correctCount > 0) return "partial";
    return "poor";
}

/** Build `weekCount` weeks (rows of Mon–Sun) ending with the current week. */
export function buildCalendarWeeks(
    days: Record<string, DaySnapshot>,
    weekCount: number,
    today: Date,
): CalendarDay[][] {
    const todayKey = formatDateKey(today);
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Back to Monday of the current week (getDay(): 0 = Sunday), then back
    // (weekCount - 1) further weeks to the grid's first cell.
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7) - (weekCount - 1) * 7);

    const weeks: CalendarDay[][] = [];
    for (let w = 0; w < weekCount; w++) {
        const week: CalendarDay[] = [];
        for (let d = 0; d < 7; d++) {
            const dateKey = formatDateKey(cursor);
            week.push({
                dateKey,
                dayOfMonth: cursor.getDate(),
                state: dateKey > todayKey ? "future" : classify(days[dateKey]),
                isToday: dateKey === todayKey,
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
    }
    return weeks;
}
