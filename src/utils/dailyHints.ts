// src/utils/dailyHints.ts
// Pure function for computing progressive daily quiz hints.

import { mulberry32, seededShuffle } from "./seededRandom";

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
