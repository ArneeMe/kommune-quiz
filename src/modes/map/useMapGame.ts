// src/modes/map/useMapGame.ts
import { useQuizState } from "../../hooks/useQuizState";
import type { KommuneFeature, QuizState } from "../../types";

export interface MapGameState extends QuizState {
    handleGuess: (kommunenummer: string) => void;
}

export function useMapGame(features: KommuneFeature[]): MapGameState {
    const quiz = useQuizState(features);

    const handleGuess = (kommunenummer: string) => {
        if (quiz.isComplete) return;
        if (quiz.solved.has(kommunenummer)) return;

        if (kommunenummer === quiz.currentTarget) {
            quiz.markSolved(kommunenummer);
        } else {
            quiz.markError();
        }
    };

    return { ...quiz, handleGuess };
}