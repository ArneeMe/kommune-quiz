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

export interface DailyDistanceHint {
    arrow: string;
    distanceKm: number;
    guessedName: string;
}

export interface DailyHints {
    fylke: string | null;
    distanceHints: DailyDistanceHint[];
    firstLetter: string | null;     // Single letter hint
    firstLetters: string | null;    // Two-letter hint (harder threshold)
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
    lastGuessedName: string | null;
    submitGuess: (kommunenummer: string) => void;
    submitNameGuess: (name: string) => void;
    giveUp: () => void;
    retryDaily: () => void;
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

    // Track all guessed kommunenummers for distance hints (history)
    const [guessedKommunenummers, setGuessedKommunenummers] = useState<string[]>([]);

    // Reset guesses when question changes
    useEffect(() => {
        setGuessedKommunenummers([]);
    }, [currentIndex]);

    // Derive last guessed name for display
    const lastGuessedKommunenummer = guessedKommunenummers.length > 0
        ? guessedKommunenummers[guessedKommunenummers.length - 1]
        : null;
    const lastGuessedName = lastGuessedKommunenummer
        ? featureMap.get(lastGuessedKommunenummer)?.properties.navn ?? null
        : null;

    // Compute progressive hints based on errors AND current game mode.
    // Each mode has a different hint unlock order to keep things varied.
    //   map:     1→ distance/arrow, 2→ fylke  (no letter hints — you already see the name)
    //   shield:  1→ first letter, 2→ two letters,    3→ fylke,         4→ distance/arrow
    //   reverse: 1→ fylke,       2→ first letter,   3→ distance/arrow, 4→ two letters
    const currentErrors = perQuestionErrors[currentIndex] ?? 0;

    // Whether distance hints are unlocked for the current mode + error count
    const distanceUnlocked = currentMode === "map"
        ? currentErrors >= 1
        : currentMode === "reverse"
            ? currentErrors >= 3
            : currentErrors >= 4; // shield

    // Build array of distance hints from all guesses (when unlocked)
    const distanceHints = useMemo<DailyDistanceHint[]>(() => {
        if (!distanceUnlocked || !currentFeature) return [];
        return guessedKommunenummers
            .map((kn) => {
                const feat = featureMap.get(kn);
                if (!feat) return null;
                const { distance, arrow } = getDistanceHint(feat, currentFeature);
                return { arrow, distanceKm: distance, guessedName: feat.properties.navn };
            })
            .filter((h): h is DailyDistanceHint => h !== null);
    }, [distanceUnlocked, currentFeature, guessedKommunenummers, featureMap]);

    const hints = useMemo<DailyHints>(() => {
        const h: DailyHints = { fylke: null, distanceHints, firstLetter: null, firstLetters: null };
        if (!currentFeature) return h;

        const name = currentFeature.properties.navn;
        const oneL = name.charAt(0).toUpperCase() + "...";
        const twoL = name.slice(0, Math.min(2, name.length)) + "...";

        const setFylke = () => { h.fylke = currentFeature.properties.fylkenavn; };
        const setOneLetter = () => { h.firstLetter = oneL; };
        const setTwoLetters = () => { h.firstLetters = twoL; };

        if (currentMode === "shield") {
            // Shield: letter hints come first (harder — no map context)
            if (currentErrors >= 1) setOneLetter();
            if (currentErrors >= 2) setTwoLetters();
            if (currentErrors >= 3) setFylke();
        } else if (currentMode === "reverse") {
            // Reverse: you see the shape — fylke first, then letters, then distance
            if (currentErrors >= 1) setFylke();
            if (currentErrors >= 2) setOneLetter();
            if (currentErrors >= 4) setTwoLetters();
        } else {
            // Map: you already see the name — only show geographic hints
            if (currentErrors >= 2) setFylke();
        }

        return h;
    }, [currentErrors, currentFeature, currentMode, distanceHints]);

    const submittingRef = useRef(false);

    const submitGuess = useCallback((kommunenummer: string) => {
        if (completed || !currentQuestion) return;
        if (submittingRef.current) return;
        submittingRef.current = true;
        requestAnimationFrame(() => { submittingRef.current = false; });

        if (kommunenummer === currentQuestion.kommunenummer) {
            advance(perQuestionErrors[currentIndex] === 0);
        } else {
            setGuessedKommunenummers((prev) => [...prev, kommunenummer]);
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
                setGuessedKommunenummers((prev) => [...prev, guessedKommunenummer]);
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

    const retryDaily = useCallback(() => {
        setStoredState(buildInitialStoredState());
        setGuessedKommunenummers([]);
    }, []);

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
        lastGuessedName,
        submitGuess,
        submitNameGuess,
        giveUp,
        retryDaily,
    };
}
