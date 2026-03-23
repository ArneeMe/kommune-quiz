// src/utils/dailyStorage.ts
// localStorage persistence for daily quiz state.

const STORAGE_KEY = "kommune-quiz-daily";

export interface StoredDailyState {
    dateKey: string;
    dayNumber: number;
    results: (boolean | null)[];   // null = not yet answered
    completed: boolean;
    currentIndex: number;          // 0-4 in progress, 5 when done
    perQuestionErrors: number[];
}

/** Validate that parsed data conforms to the expected StoredDailyState shape. */
function isValidDailyState(data: unknown): data is StoredDailyState {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.dateKey === "string" &&
        typeof d.dayNumber === "number" &&
        typeof d.completed === "boolean" &&
        typeof d.currentIndex === "number" &&
        d.currentIndex >= 0 && d.currentIndex <= 5 &&
        Array.isArray(d.results) &&
        d.results.every((r: unknown) => r === null || typeof r === "boolean") &&
        Array.isArray(d.perQuestionErrors) &&
        d.perQuestionErrors.every((e: unknown) => typeof e === "number" && e >= 0)
    );
}

/** Load today's daily state. Returns null if no saved state, dateKey mismatch, or invalid shape. */
export function loadDailyState(dateKey: string): StoredDailyState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isValidDailyState(parsed)) return null;
        if (parsed.dateKey !== dateKey) return null;
        return parsed;
    } catch {
        return null;
    }
}

/** Save daily quiz state to localStorage. */
export function saveDailyState(state: StoredDailyState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Silently fail — localStorage may be full or unavailable.
    }
}

/** Check if today's daily quiz has already been completed. */
export function isDailyCompleted(dateKey: string): boolean {
    const state = loadDailyState(dateKey);
    return state?.completed ?? false;
}
