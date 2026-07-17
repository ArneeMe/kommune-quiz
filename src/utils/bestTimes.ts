// src/utils/bestTimes.ts
// localStorage persistence for freeplay personal-best times.
// Keyed per mode + fylke scope so "Kart · Hele Norge" and "Kart · Agder"
// are separate records. Fewer errors beats faster time.

import type { GameMode } from "../types";

const STORAGE_KEY = "kommune-quiz-best-times";

export interface BestTime {
    timeSeconds: number;
    errors: number;
    dateKey: string;
}

/** Keyed by `${mode}:${fylkesnummer ?? "all"}` */
export type BestTimes = Record<string, BestTime>;

export function bestTimeKey(mode: GameMode, fylkesnummer: string | null): string {
    return `${mode}:${fylkesnummer ?? "all"}`;
}

function isValidBestTime(data: unknown): data is BestTime {
    if (typeof data !== "object" || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.timeSeconds === "number" && Number.isFinite(d.timeSeconds) && d.timeSeconds >= 0 &&
        typeof d.errors === "number" && Number.isInteger(d.errors) && d.errors >= 0 &&
        typeof d.dateKey === "string"
    );
}

export function loadBestTimes(): BestTimes {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return {};
        const result: BestTimes = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (isValidBestTime(value)) result[key] = value;
        }
        return result;
    } catch {
        return {};
    }
}

export function loadBestTime(key: string): BestTime | null {
    return loadBestTimes()[key] ?? null;
}

/** Ranking rule: fewer errors wins; time breaks ties. */
export function isBetter(candidate: BestTime, previous: BestTime | null): boolean {
    if (!previous) return true;
    if (candidate.errors !== previous.errors) return candidate.errors < previous.errors;
    return candidate.timeSeconds < previous.timeSeconds;
}

export function saveBestTime(key: string, best: BestTime): void {
    const all = loadBestTimes();
    all[key] = best;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        // Silently fail — localStorage may be full or unavailable.
    }
}
