// src/modes/reverse/useReverseGame.ts
// Reverse mode: see a highlighted kommune on the map, type its name.

import { useCallback, useMemo } from "react";
import { useQuizState } from "../../hooks/useQuizState";
import type { KommuneFeature, QuizState } from "../../types";

export interface ReverseGameState extends QuizState {
    handleNameGuess: (name: string) => void;
    allNames: string[];
    highlightedKommune: string | null;
}

export function useReverseGame(features: KommuneFeature[]): ReverseGameState {
    const quiz = useQuizState(features);

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

    const handleNameGuess = useCallback((name: string) => {
        if (quiz.isComplete) return;

        const kommunenummer = nameLookup.get(name.toLowerCase());
        if (kommunenummer === quiz.currentTarget) {
            quiz.markSolved(kommunenummer);
        } else {
            quiz.markError();
        }
    }, [quiz.currentTarget, quiz.isComplete, quiz.markSolved, quiz.markError, nameLookup]);

    return {
        ...quiz,
        handleNameGuess,
        allNames,
        highlightedKommune: quiz.currentTarget,
    };
}