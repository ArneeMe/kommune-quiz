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

/** Load today's daily state. Returns null if no saved state or if dateKey doesn't match. */
export function loadDailyState(dateKey: string): StoredDailyState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: StoredDailyState = JSON.parse(raw);
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
