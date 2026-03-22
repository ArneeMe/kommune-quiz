// src/modes/map/useMapGame.ts
import { useState, useEffect, useCallback } from "react";
import { useQuizState } from "../../hooks/useQuizState";
import type { KommuneFeature, QuizState } from "../../types";

export interface MapGameState extends QuizState {
    handleGuess: (kommunenummer: string) => void;
    justSolved: string | null;
    wrongGuess: string | null;
}

export function useMapGame(features: KommuneFeature[]): MapGameState {
    const quiz = useQuizState(features);
    const [justSolved, setJustSolved] = useState<string | null>(null);
    const [wrongGuess, setWrongGuess] = useState<string | null>(null);

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

    const handleGuess = useCallback((kommunenummer: string) => {
        if (quiz.isComplete) return;
        if (quiz.solved.has(kommunenummer)) return;

        if (kommunenummer === quiz.currentTarget) {
            setJustSolved(kommunenummer);
            quiz.markSolved(kommunenummer);
        } else {
            setWrongGuess(kommunenummer);
            quiz.markError();
        }
    }, [quiz]);

    return { ...quiz, handleGuess, justSolved, wrongGuess };
}
