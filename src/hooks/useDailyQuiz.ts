// src/hooks/useDailyQuiz.ts
// State machine for the daily quiz: 5 fixed questions, per-question mode & error tracking,
// localStorage persistence for resume and one-attempt-per-day semantics.

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { KommuneFeature, GameMode, DailyQuestion } from "../types";
import { generateDailyChallenge } from "../utils/dailyChallenge";
import { getDayNumber, getTodayDateKey } from "../utils/seededRandom";
import { loadDailyState, saveDailyState, loadDailyHistory, saveDayResult, type StoredDailyState, type DailyHistory } from "../utils/dailyStorage";
import { getDistanceHint, computeAreaKm2 } from "../utils/geoDistance";
import { buildFeatureMap, buildNameLookup, buildSortedNames } from "../utils/featureLookup";
import { computeLetterBlanks, type LetterBlanks } from "../utils/dailyHints";

const QUESTION_COUNT = 5;

export interface DailyDistanceHint {
    arrow: string;
    distanceKm: number;
    guessedName: string;
    proximity: number;
}

export interface DailyHints {
    distanceHints: DailyDistanceHint[];
    letterBlanks: LetterBlanks | null;
    /** Area of the target kommune in km² (shield mode only) */
    areaHint: number | null;
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
    round: number;
    history: DailyHistory;
    submitGuess: (kommunenummer: string) => void;
    submitNameGuess: (name: string) => void;
    giveUp: () => void;
    retryDaily: () => void;
    playOneMore: () => void;
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
    // Round 0 = canonical daily. Round 1+ = bonus rounds with different questions.
    const [round, setRound] = useState(0);
    const [history, setHistory] = useState<DailyHistory>(() => loadDailyHistory());

    const challenge = useMemo(
        () => features.length > 0 ? generateDailyChallenge(features, TODAY, round) : null,
        [features, round],
    );

    const questions = useMemo(
        () => challenge?.questions ?? [],
        [challenge],
    );

    // Restore from localStorage or create fresh state
    const [storedState, setStoredState] = useState<StoredDailyState>(() => {
        return loadDailyState(DATE_KEY) ?? buildInitialStoredState();
    });

    // Only persist round 0 (the canonical daily) to localStorage.
    // Bonus rounds are ephemeral — refreshing returns to the daily result.
    useEffect(() => {
        if (round === 0) saveDailyState(storedState);
    }, [storedState, round]);

    // Save day result to history when quiz completes (round 0 only)
    useEffect(() => {
        if (round !== 0 || !storedState.completed) return;
        const finalResults = storedState.results.map((r) => r === true);
        const correctCount = finalResults.filter(Boolean).length;
        const totalErrors = storedState.perQuestionErrors.reduce((s, e) => s + e, 0);
        const updated = saveDayResult(DATE_KEY, { correctCount, totalErrors, results: finalResults });
        setHistory(updated);
    }, [storedState.completed, round]);

    // Lookup maps
    const featureMap = useMemo(() => buildFeatureMap(features), [features]);
    const nameLookup = useMemo(() => buildNameLookup(features), [features]);
    const allNames = useMemo(() => buildSortedNames(features), [features]);

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
    //
    //   map:     error 1 → fylke, error 2+ → arrows (never letter hints)
    //   shield:  error 1 → fylke, error 2 → 1 letter, error 3 → (nothing new),
    //            error 4 → 2 letters, error 5 → (nothing new), error 6 → 3 letters
    //   reverse: same as shield (no arrows)
    const currentErrors = perQuestionErrors[currentIndex] ?? 0;

    // Map mode shows distance hints from first wrong guess; shield/reverse never show distance
    const distanceUnlocked = currentMode === "map" && currentErrors >= 1;

    // Build array of distance hints from all map mode guesses
    const distanceHints = useMemo<DailyDistanceHint[]>(() => {
        if (!distanceUnlocked || !currentFeature) return [];
        return guessedKommunenummers
            .map((kn) => {
                const feat = featureMap.get(kn);
                if (!feat) return null;
                const { distance, arrow, proximity } = getDistanceHint(feat, currentFeature);
                return { arrow, distanceKm: distance, guessedName: feat.properties.navn, proximity };
            })
            .filter((h): h is DailyDistanceHint => h !== null);
    }, [distanceUnlocked, currentFeature, guessedKommunenummers, featureMap]);

    const hints = useMemo<DailyHints>(() => {
        const letterBlanks = (currentMode === "shield" || currentMode === "reverse")
            ? computeLetterBlanks(currentName, currentErrors, currentKommunenummer, { sequential: currentMode === "reverse" })
            : null;
        const areaHint = currentMode === "shield" && currentErrors >= 1 && currentFeature
            ? computeAreaKm2(currentFeature)
            : null;
        return { distanceHints, letterBlanks, areaHint };
    }, [currentErrors, currentMode, currentName, currentKommunenummer, currentFeature, distanceHints]);

    const submittingRef = useRef(false);

    const submitGuess = useCallback((kommunenummer: string) => {
        if (completed || !currentQuestion) return;
        if (submittingRef.current) return;
        submittingRef.current = true;
        requestAnimationFrame(() => { submittingRef.current = false; });

        if (kommunenummer === currentQuestion.kommunenummer) {
            advance(true);
        } else {
            setGuessedKommunenummers((prev) => [...prev, kommunenummer]);
            setStoredState((prev) => {
                const newErrors = [...prev.perQuestionErrors];
                newErrors[prev.currentIndex] += 1;
                return { ...prev, perQuestionErrors: newErrors };
            });
        }
    }, [completed, currentQuestion, advance]);

    const submitNameGuess = useCallback((name: string) => {
        if (completed || !currentQuestion) return;
        if (submittingRef.current) return;
        submittingRef.current = true;
        requestAnimationFrame(() => { submittingRef.current = false; });
        const guessedKommunenummer = nameLookup.get(name.toLowerCase());
        if (guessedKommunenummer === currentQuestion.kommunenummer) {
            advance(true);
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

    const playOneMore = useCallback(() => {
        setRound((prev) => prev + 1);
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
        round,
        history,
        submitGuess,
        submitNameGuess,
        giveUp,
        retryDaily,
        playOneMore,
    };
}
