// src/hooks/useDailyQuiz.ts
// State machine for the daily quiz: 5 fixed questions, per-question mode & error tracking,
// localStorage persistence for resume and one-attempt-per-day semantics.

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { KommuneFeature, GameMode, DailyQuestion } from "../types";
import { generateDailyChallenge } from "../utils/dailyChallenge";
import { getDayNumber, getTodayDateKey } from "../utils/seededRandom";
import { loadDailyState, saveDailyState, type StoredDailyState } from "../utils/dailyStorage";
import { getDistanceHint } from "../utils/geoDistance";

const QUESTION_COUNT = 5;

export interface DailyHints {
    fylke: string | null;           // Shown after 1 wrong guess
    distanceKm: number | null;      // Shown after 2 wrong guesses
    directionArrow: string | null;  // Shown after 2 wrong guesses
    firstLetters: string | null;    // Shown after 3 wrong guesses
}

export interface DailyQuizState {
    questions: DailyQuestion[];
    currentIndex: number;
    currentQuestion: DailyQuestion | null;
    currentFeature: KommuneFeature | null;
    currentMode: GameMode;
    currentName: string;
    currentKommunenummer: string;
    perQuestionErrors: number[];
    results: (boolean | null)[];
    isComplete: boolean;
    alreadyCompleted: boolean;
    dayNumber: number;
    dateKey: string;
    totalErrors: number;
    correctCount: number;
    solved: Set<string>;
    allNames: string[];
    hints: DailyHints;
    lastGuessedFeature: KommuneFeature | null;
    submitGuess: (kommunenummer: string) => void;
    submitNameGuess: (name: string) => void;
    giveUp: () => void;
}

// Compute dateKey and dayNumber once at module load — they don't change during a session.
const TODAY = new Date();
const DATE_KEY = getTodayDateKey();
const DAY_NUMBER = getDayNumber(TODAY);

function buildInitialStoredState(): StoredDailyState {
    return {
        dateKey: DATE_KEY,
        dayNumber: DAY_NUMBER,
        results: Array(QUESTION_COUNT).fill(null),
        completed: false,
        currentIndex: 0,
        perQuestionErrors: Array(QUESTION_COUNT).fill(0),
    };
}

export function useDailyQuiz(features: KommuneFeature[]): DailyQuizState {
    const challenge = useMemo(
        () => features.length > 0 ? generateDailyChallenge(features, TODAY) : null,
        [features],
    );

    const questions = useMemo(
        () => challenge?.questions ?? [],
        [challenge],
    );

    // Restore from localStorage or create fresh state
    const [storedState, setStoredState] = useState<StoredDailyState>(() => {
        return loadDailyState(DATE_KEY) ?? buildInitialStoredState();
    });

    // Persist on every state change
    useEffect(() => {
        saveDailyState(storedState);
    }, [storedState]);

    // Lookup maps
    const featureMap = useMemo(() => {
        const map = new Map<string, KommuneFeature>();
        for (const f of features) {
            map.set(f.properties.kommunenummer, f);
        }
        return map;
    }, [features]);

    const nameLookup = useMemo(() => {
        const map = new Map<string, string>();
        for (const f of features) {
            map.set(f.properties.navn.toLowerCase(), f.properties.kommunenummer);
        }
        return map;
    }, [features]);

    const allNames = useMemo(
        () => features.map((f) => f.properties.navn).sort((a, b) => a.localeCompare(b, "no")),
        [features],
    );

    // Derived state
    const { currentIndex, perQuestionErrors, results, completed } = storedState;

    const currentQuestion = currentIndex < questions.length ? questions[currentIndex] : null;
    const currentFeature = currentQuestion ? featureMap.get(currentQuestion.kommunenummer) ?? null : null;
    const currentMode: GameMode = currentQuestion?.mode ?? "map";
    const currentName = currentFeature?.properties.navn ?? "";
    const currentKommunenummer = currentQuestion?.kommunenummer ?? "";

    const totalErrors = perQuestionErrors.reduce((sum, e) => sum + e, 0);
    const correctCount = results.filter((r) => r === true).length;

    const solved = useMemo(() => {
        const set = new Set<string>();
        for (let i = 0; i < currentIndex && i < questions.length; i++) {
            if (results[i] !== null) {
                set.add(questions[i].kommunenummer);
            }
        }
        return set;
    }, [currentIndex, questions, results]);

    const advance = useCallback((correct: boolean) => {
        setStoredState((prev) => {
            const nextIndex = prev.currentIndex + 1;
            const newResults = [...prev.results];
            newResults[prev.currentIndex] = correct;
            const done = nextIndex >= QUESTION_COUNT;
            return {
                ...prev,
                currentIndex: nextIndex,
                results: newResults,
                completed: done,
            };
        });
    }, []);

    // Track last guessed feature for distance hints
    const [lastGuessedKommunenummer, setLastGuessedKommunenummer] = useState<string | null>(null);
    const lastGuessedFeature = lastGuessedKommunenummer ? featureMap.get(lastGuessedKommunenummer) ?? null : null;

    // Reset last guess when question changes
    useEffect(() => {
        setLastGuessedKommunenummer(null);
    }, [currentIndex]);

    // Compute progressive hints based on errors for current question
    const currentErrors = perQuestionErrors[currentIndex] ?? 0;
    const hints = useMemo<DailyHints>(() => {
        const h: DailyHints = { fylke: null, distanceKm: null, directionArrow: null, firstLetters: null };
        if (!currentFeature) return h;

        // After 1 wrong: show fylke
        if (currentErrors >= 1) {
            h.fylke = currentFeature.properties.fylkenavn;
        }

        // After 2 wrong: show distance + direction from last guess
        if (currentErrors >= 2 && lastGuessedFeature && currentFeature) {
            const { distance, arrow } = getDistanceHint(lastGuessedFeature, currentFeature);
            h.distanceKm = distance;
            h.directionArrow = arrow;
        }

        // After 3 wrong: show first 2 letters of name
        if (currentErrors >= 3) {
            const name = currentFeature.properties.navn;
            h.firstLetters = name.slice(0, Math.min(2, name.length)) + "...";
        }

        return h;
    }, [currentErrors, currentFeature, lastGuessedFeature]);

    const submittingRef = useRef(false);

    const submitGuess = useCallback((kommunenummer: string) => {
        if (completed || !currentQuestion) return;
        if (submittingRef.current) return;
        submittingRef.current = true;
        requestAnimationFrame(() => { submittingRef.current = false; });

        if (kommunenummer === currentQuestion.kommunenummer) {
            advance(perQuestionErrors[currentIndex] === 0);
        } else {
            setLastGuessedKommunenummer(kommunenummer);
            setStoredState((prev) => {
                const newErrors = [...prev.perQuestionErrors];
                newErrors[prev.currentIndex] += 1;
                return { ...prev, perQuestionErrors: newErrors };
            });
        }
    }, [completed, currentQuestion, currentIndex, perQuestionErrors, advance]);

    const submitNameGuess = useCallback((name: string) => {
        if (completed || !currentQuestion) return;
        if (submittingRef.current) return;
        submittingRef.current = true;
        requestAnimationFrame(() => { submittingRef.current = false; });
        const guessedKommunenummer = nameLookup.get(name.toLowerCase());
        if (guessedKommunenummer === currentQuestion.kommunenummer) {
            advance(perQuestionErrors[currentIndex] === 0);
        } else {
            if (guessedKommunenummer) {
                setLastGuessedKommunenummer(guessedKommunenummer);
            }
            setStoredState((prev) => {
                const newErrors = [...prev.perQuestionErrors];
                newErrors[prev.currentIndex] += 1;
                return { ...prev, perQuestionErrors: newErrors };
            });
        }
    }, [completed, currentQuestion, currentIndex, perQuestionErrors, nameLookup, advance]);

    const giveUp = useCallback(() => {
        if (completed || !currentQuestion) return;
        advance(false);
    }, [completed, currentQuestion, advance]);

    return {
        questions,
        currentIndex,
        currentQuestion,
        currentFeature,
        currentMode,
        currentName,
        currentKommunenummer,
        perQuestionErrors,
        results,
        isComplete: completed,
        alreadyCompleted: completed,
        dayNumber: DAY_NUMBER,
        dateKey: DATE_KEY,
        totalErrors,
        correctCount,
        solved,
        allNames,
        hints,
        lastGuessedFeature,
        submitGuess,
        submitNameGuess,
        giveUp,
    };
}
