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
 *   map:     error 1 → fylke, error 2 → first letter + arrows start
 *   shield:  error 1 → fylke, then 1 letter per 2 additional errors (max 3)
 *   reverse: same as shield (no arrows)
 */
export function computeDailyHints(
    mode: GameMode,
    errors: number,
    feature: KommuneFeature | null,
): HintResult {
    const h: HintResult = { fylke: null, letterReveal: null };
    if (!feature) return h;

    const name = feature.properties.navn;

    if (errors >= 1) h.fylke = feature.properties.fylkenavn;

    if (mode === "map") {
        // Map: first letter after 2 errors
        if (errors >= 2) h.letterReveal = name.charAt(0) + "...";
    } else {
        // Shield / Reverse: 1 letter per 2 errors after the first (max 3 letters)
        // error 2 → 1 letter, error 4 → 2 letters, error 6 → 3 letters
        const letterCount = Math.min(3, Math.floor(Math.max(0, errors - 1) / 2));
        if (letterCount >= 1) h.letterReveal = name.slice(0, letterCount) + "...";
    }

    return h;
}
