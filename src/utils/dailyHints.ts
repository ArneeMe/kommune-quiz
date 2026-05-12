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
    options: { sequential?: boolean } = {},
): LetterBlanks {
    const chars = [...name];
    const slots: (string | null)[] = chars.map((ch) =>
        ch === " " || ch === "-" ? ch : null,
    );

    const revealableIndices = chars
        .map((ch, i) => (ch !== " " && ch !== "-" ? i : -1))
        .filter((i) => i >= 0);

    // Sequential mode: always reveal letters left-to-right (prefix grows).
    // Otherwise: first letter, then a stable random order.
    let order: number[];
    if (options.sequential) {
        order = revealableIndices;
    } else {
        const rng = mulberry32(parseInt(kommunenummer, 10) + 7919);
        order = revealableIndices.length > 0
            ? [revealableIndices[0], ...seededShuffle(revealableIndices.slice(1), rng)]
            : [];
    }

    const toReveal = Math.min(errorCount, order.length);
    for (let i = 0; i < toReveal; i++) {
        slots[order[i]] = chars[order[i]];
    }

    const display = slots
        .map((s) => (s === " " ? "  " : s === "-" ? "-" : s ?? "_"))
        .join(" ");

    return { slots, display };
}
