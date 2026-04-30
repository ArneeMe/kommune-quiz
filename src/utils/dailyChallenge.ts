// src/utils/dailyChallenge.ts
// Generates a deterministic set of 5 daily quiz questions from a date seed.

import type { KommuneFeature, GameMode } from "../types";
import type { DailyQuestion } from "../types/game";
import { mulberry32, dateToSeed, seededShuffle, getDayNumber, formatDateKey } from "./seededRandom";

const DAILY_QUESTION_COUNT = 5;

// Fixed mode order: 2 map, 2 reverse (gjett navn), 1 shield (kommunevåpen)
const DAILY_MODE_ORDER: GameMode[] = ["map", "map", "reverse", "reverse", "shield"];

// Prime offset so each bonus round gets a very different sequence
const ROUND_SEED_OFFSET = 7919;

export interface DailyChallenge {
    questions: DailyQuestion[];
    dayNumber: number;
    dateKey: string;
}

/**
 * Generate the daily challenge for a given date.
 * Round 0 = canonical daily (seeded by date only).
 * Round 1+ = bonus rounds (different kommuner, same fixed mode order).
 */
export function generateDailyChallenge(
    features: KommuneFeature[],
    date: Date,
    round = 0,
): DailyChallenge {
    const seed = dateToSeed(date) + round * ROUND_SEED_OFFSET;
    const rng = mulberry32(seed);

    const kommunenummers = features.map((f) => f.properties.kommunenummer);
    const shuffled = seededShuffle(kommunenummers, rng);
    const selected = shuffled.slice(0, DAILY_QUESTION_COUNT);

    const questions: DailyQuestion[] = selected.map((kommunenummer, i) => ({
        kommunenummer,
        mode: DAILY_MODE_ORDER[i],
    }));

    return {
        questions,
        dayNumber: getDayNumber(date),
        dateKey: formatDateKey(date),
    };
}
