// src/utils/seededRandom.ts
// Deterministic PRNG utilities for daily quiz generation.

/** Mulberry32 — a fast, seedable 32-bit PRNG. */
export function mulberry32(seed: number): () => number {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Convert a Date to a numeric seed (YYYYMMDD). */
export function dateToSeed(date: Date): number {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return y * 10000 + m * 100 + d;
}

/** Fisher-Yates shuffle driven by the given RNG. */
export function seededShuffle<T>(array: T[], rng: () => number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const EPOCH = new Date("2026-01-01T00:00:00");

/** Wordle-style day number (1-based) from a fixed epoch. */
export function getDayNumber(date: Date): number {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = start.getTime() - EPOCH.getTime();
    return Math.floor(diff / 86400000) + 1;
}

/** Today's date as "YYYY-MM-DD". */
export function getTodayDateKey(): string {
    const d = new Date();
    return formatDateKey(d);
}

/** Format a Date as "YYYY-MM-DD". */
export function formatDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
