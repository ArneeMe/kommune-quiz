// src/modes/map/useMapGame.ts
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuizState } from "../../hooks/useQuizState";
import { getDistanceHint } from "../../utils/geoDistance";
import { buildFeatureMap } from "../../utils/featureLookup";
import type { KommuneFeature, QuizState } from "../../types";

export interface DistanceHint {
    arrow: string;
    distanceKm: number;
}

export interface MapGameState extends QuizState {
    handleGuess: (kommunenummer: string) => void;
    justSolved: string | null;
    wrongGuess: string | null;
    /** Number of wrong guesses on the current question */
    currentQuestionErrors: number;
    /** The last wrong guess kommunenummer (for arrow hint origin) */
    lastWrongKommune: string | null;
    /** All emoji arrow + distance hints from wrong guesses */
    distanceHints: DistanceHint[];
}

export function useMapGame(features: KommuneFeature[]): MapGameState {
    const quiz = useQuizState(features);
    const [justSolved, setJustSolved] = useState<string | null>(null);
    const [wrongGuess, setWrongGuess] = useState<string | null>(null);
    const [currentQuestionErrors, setCurrentQuestionErrors] = useState(0);
    const [lastWrongKommune, setLastWrongKommune] = useState<string | null>(null);
    const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
    const prevTarget = useRef(quiz.currentTarget);

    // Reset per-question errors when target changes
    useEffect(() => {
        if (prevTarget.current !== quiz.currentTarget) {
            prevTarget.current = quiz.currentTarget;
            setCurrentQuestionErrors(0);
            setLastWrongKommune(null);
            setWrongGuesses([]);
        }
    }, [quiz.currentTarget]);

    // Clear flash states after animation
    useEffect(() => {
        if (!justSolved) return;
        const timer = setTimeout(() => setJustSolved(null), 600);
        return () => clearTimeout(timer);
    }, [justSolved]);

    useEffect(() => {
        if (!wrongGuess) return;
        const timer = setTimeout(() => setWrongGuess(null), 300);
        return () => clearTimeout(timer);
    }, [wrongGuess]);

    const submittingRef = useRef(false);

    const handleGuess = useCallback((kommunenummer: string) => {
        if (quiz.isComplete) return;
        if (quiz.solved.has(kommunenummer)) return;
        if (submittingRef.current) return;
        submittingRef.current = true;

        if (kommunenummer === quiz.currentTarget) {
            setJustSolved(kommunenummer);
            quiz.markSolved(kommunenummer);
        } else {
            setWrongGuess(kommunenummer);
            setLastWrongKommune(kommunenummer);
            setWrongGuesses((prev) => [...prev, kommunenummer]);
            setCurrentQuestionErrors((prev) => prev + 1);
            quiz.markError();
        }

        // Release lock after React has processed the state update
        requestAnimationFrame(() => { submittingRef.current = false; });
    }, [quiz]);

    // Build feature lookup for distance computation
    const featureMap = useMemo(() => buildFeatureMap(features), [features]);

    // Compute emoji arrow + distance hints from all wrong guesses
    const distanceHints = useMemo<DistanceHint[]>(() => {
        if (!quiz.currentTarget) return [];
        const toFeature = featureMap.get(quiz.currentTarget);
        if (!toFeature) return [];
        return wrongGuesses
            .map((kn) => {
                const fromFeature = featureMap.get(kn);
                if (!fromFeature) return null;
                const { distance, arrow } = getDistanceHint(fromFeature, toFeature);
                return { arrow, distanceKm: distance };
            })
            .filter((h): h is DistanceHint => h !== null);
    }, [wrongGuesses, quiz.currentTarget, featureMap]);

    const baseRestart = quiz.handleRestart;
    const handleRestart = useCallback(() => {
        baseRestart();
        setCurrentQuestionErrors(0);
        setLastWrongKommune(null);
        setWrongGuesses([]);
    }, [baseRestart]);

    return { ...quiz, handleGuess, justSolved, wrongGuess, currentQuestionErrors, lastWrongKommune, distanceHints, handleRestart };
}
