// src/modes/shield/useShieldGame.ts
// Shield mode: see the coat of arms, type the kommune name.

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuizState } from "../../hooks/useQuizState";
import type { KommuneFeature, QuizState } from "../../types";

export interface ShieldGameState extends QuizState {
    handleNameGuess: (name: string) => void;
    allNames: string[];
    /** Number of wrong guesses on the current question */
    currentQuestionErrors: number;
    /** First letter hint (shown after 2 errors) */
    letterHint: string | null;
}

export function useShieldGame(features: KommuneFeature[]): ShieldGameState {
    const quiz = useQuizState(features);
    const [currentQuestionErrors, setCurrentQuestionErrors] = useState(0);
    const prevTarget = useRef(quiz.currentTarget);

    // Reset per-question errors when target changes
    useEffect(() => {
        if (prevTarget.current !== quiz.currentTarget) {
            prevTarget.current = quiz.currentTarget;
            setCurrentQuestionErrors(0);
        }
    }, [quiz.currentTarget]);

    // Build a lookup: lowercase name → kommunenummer
    const nameLookup = useMemo(() => {
        const map = new Map<string, string>();
        for (const f of features) {
            map.set(f.properties.navn.toLowerCase(), f.properties.kommunenummer);
        }
        return map;
    }, [features]);

    const allNames = useMemo(
        () => features.map((f) => f.properties.navn).sort((a, b) => a.localeCompare(b, "no")),
        [features]
    );

    const submittingRef = useRef(false);

    const handleNameGuess = useCallback((name: string) => {
        if (quiz.isComplete) return;
        if (submittingRef.current) return;
        submittingRef.current = true;

        const kommunenummer = nameLookup.get(name.toLowerCase());
        if (kommunenummer === quiz.currentTarget) {
            quiz.markSolved(kommunenummer);
        } else {
            setCurrentQuestionErrors((prev) => prev + 1);
            quiz.markError();
        }

        requestAnimationFrame(() => { submittingRef.current = false; });
    }, [quiz, nameLookup]);

    // Show first letter after 2 errors
    const letterHint = currentQuestionErrors >= 2 && quiz.currentName
        ? quiz.currentName.charAt(0).toUpperCase()
        : null;

    const baseRestart = quiz.handleRestart;
    const handleRestart = useCallback(() => {
        baseRestart();
        setCurrentQuestionErrors(0);
    }, [baseRestart]);

    return { ...quiz, handleNameGuess, allNames, currentQuestionErrors, letterHint, handleRestart };
}