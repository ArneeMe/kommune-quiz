// src/utils/dailyChallenge.ts
// Generates a deterministic set of 5 daily quiz questions from a date seed.

import type { KommuneFeature, GameMode } from "../types";
import type { DailyQuestion } from "../types/game";
import { mulberry32, dateToSeed, seededShuffle, getDayNumber, formatDateKey } from "./seededRandom";

const DAILY_QUESTION_COUNT = 5;
const MODES: GameMode[] = ["map", "shield", "reverse"];

export interface DailyChallenge {
    questions: DailyQuestion[];
    dayNumber: number;
    dateKey: string;
}

/** Generate the daily challenge for a given date. Pure and deterministic. */
export function generateDailyChallenge(
    features: KommuneFeature[],
    date: Date,
): DailyChallenge {
    const seed = dateToSeed(date);
    const rng = mulberry32(seed);

    const kommunenummers = features.map((f) => f.properties.kommunenummer);
    const shuffled = seededShuffle(kommunenummers, rng);
    const selected = shuffled.slice(0, DAILY_QUESTION_COUNT);

    const questions: DailyQuestion[] = selected.map((kommunenummer) => ({
        kommunenummer,
        mode: MODES[Math.floor(rng() * MODES.length)],
    }));

    return {
        questions,
        dayNumber: getDayNumber(date),
        dateKey: formatDateKey(date),
    };
}
