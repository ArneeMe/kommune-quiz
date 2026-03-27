// src/modes/map/useMapGame.ts
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuizState } from "../../hooks/useQuizState";
import { getDistanceHint } from "../../utils/geoDistance";
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
    /** Emoji arrow + distance hint after wrong guess */
    distanceHint: DistanceHint | null;
}

export function useMapGame(features: KommuneFeature[]): MapGameState {
    const quiz = useQuizState(features);
    const [justSolved, setJustSolved] = useState<string | null>(null);
    const [wrongGuess, setWrongGuess] = useState<string | null>(null);
    const [currentQuestionErrors, setCurrentQuestionErrors] = useState(0);
    const [lastWrongKommune, setLastWrongKommune] = useState<string | null>(null);
    const prevTarget = useRef(quiz.currentTarget);

    // Reset per-question errors when target changes
    useEffect(() => {
        if (prevTarget.current !== quiz.currentTarget) {
            prevTarget.current = quiz.currentTarget;
            setCurrentQuestionErrors(0);
            setLastWrongKommune(null);
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
            setCurrentQuestionErrors((prev) => prev + 1);
            quiz.markError();
        }

        // Release lock after React has processed the state update
        requestAnimationFrame(() => { submittingRef.current = false; });
    }, [quiz]);

    // Build feature lookup for distance computation
    const featureMap = useMemo(() => {
        const map = new Map<string, KommuneFeature>();
        for (const f of features) map.set(f.properties.kommunenummer, f);
        return map;
    }, [features]);

    // Compute emoji arrow + distance hint when there's a wrong guess
    const distanceHint = useMemo<DistanceHint | null>(() => {
        if (!lastWrongKommune || !quiz.currentTarget) return null;
        const fromFeature = featureMap.get(lastWrongKommune);
        const toFeature = featureMap.get(quiz.currentTarget);
        if (!fromFeature || !toFeature) return null;
        const { distance, arrow } = getDistanceHint(fromFeature, toFeature);
        return { arrow, distanceKm: distance };
    }, [lastWrongKommune, quiz.currentTarget, featureMap]);

    const baseRestart = quiz.handleRestart;
    const handleRestart = useCallback(() => {
        baseRestart();
        setCurrentQuestionErrors(0);
        setLastWrongKommune(null);
    }, [baseRestart]);

    return { ...quiz, handleGuess, justSolved, wrongGuess, currentQuestionErrors, lastWrongKommune, distanceHint, handleRestart };
}
