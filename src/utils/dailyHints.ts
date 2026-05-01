// src/utils/dailyHints.ts
// Pure function for computing progressive daily quiz hints.

import type { KommuneFeature, GameMode } from "../types";
import { mulberry32, seededShuffle } from "./seededRandom";

export interface HintResult {
    fylke: string | null;
    letterReveal: string | null;
}

export interface LetterBlanks {
    slots: (string | null)[];
    display: string;
}

export function computeLetterBlanks(
    name: string,
    errorCount: number,
    kommunenummer: string,
): LetterBlanks {
    const chars = [...name];
    const slots: (string | null)[] = chars.map((ch) =>
        ch === " " || ch === "-" ? ch : null,
    );

    const revealableIndices = chars
        .map((ch, i) => (ch !== " " && ch !== "-" ? i : -1))
        .filter((i) => i >= 0);

    const rng = mulberry32(parseInt(kommunenummer, 10) + 7919);
    const shuffled = seededShuffle(revealableIndices, rng);

    const toReveal = Math.min(errorCount, shuffled.length);
    for (let i = 0; i < toReveal; i++) {
        slots[shuffled[i]] = chars[shuffled[i]];
    }

    const display = slots
        .map((s) => (s === " " ? "  " : s === "-" ? "-" : s ?? "_"))
        .join(" ");

    return { slots, display };
}

export function computeDailyHints(
    mode: GameMode,
    errors: number,
    feature: KommuneFeature | null,
): HintResult {
    const h: HintResult = { fylke: null, letterReveal: null };
    if (!feature) return h;

    if (mode === "map") {
        if (errors >= 1) h.fylke = feature.properties.fylkenavn;
    }

    return h;
}
