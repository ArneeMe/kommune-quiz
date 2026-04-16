// src/utils/dailyHints.ts
// Pure function for computing progressive daily quiz hints.

import type { KommuneFeature, GameMode } from "../types";

export interface HintResult {
    fylke: string | null;
    letterReveal: string | null;
}

/**
 * Compute the hint state for a daily quiz question based on mode and error count.
 *
 *   map:     error 1 → fylke, error 2+ → arrows (never letter hints)
 *   shield:  error 1 → fylke, then 1 letter per 2 additional errors (max 3)
 *   reverse: same as shield
 */
export function computeDailyHints(
    mode: GameMode,
    errors: number,
    feature: KommuneFeature | null,
): HintResult {
    const h: HintResult = { fylke: null, letterReveal: null };
    if (!feature) return h;

    const name = feature.properties.navn;

    // How many letters to reveal (shield and reverse only):
    // error 2 → 1 letter, error 4 → 2 letters, error 6 → 3 letters
    const letterCount = mode !== "map"
        ? Math.min(3, Math.floor(Math.max(0, errors - 1) / 2))
        : 0;

    if (errors >= 1) h.fylke = feature.properties.fylkenavn;

    if (mode !== "map" && letterCount >= 1) {
        h.letterReveal = name.slice(0, letterCount) + "...";
    }

    return h;
}
