// src/hooks/useGameState.ts
// Map mode game logic: wraps useQuizState with click-to-guess validation.
// Kept as a separate hook so map mode specifics don't leak into shared state.

import { useCallback } from "react";
import { useQuizState } from "./useQuizState";
import type { KommuneFeature, MapGameState } from "../types";

export function useGameState(features: KommuneFeature[]): MapGameState {
    const quiz = useQuizState(features);

    const handleGuess = useCallback((kommunenummer: string) => {
        if (quiz.isComplete) return;
        if (quiz.solved.has(kommunenummer)) return;

        if (kommunenummer === quiz.currentTarget) {
            quiz.markSolved(kommunenummer);
        } else {
            quiz.markError();
        }
    }, [quiz.currentTarget, quiz.isComplete, quiz.solved, quiz.markSolved, quiz.markError]);

    return { ...quiz, handleGuess };
}