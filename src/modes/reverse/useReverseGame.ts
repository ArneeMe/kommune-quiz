// src/modes/reverse/useReverseGame.ts
// Reverse mode: see a highlighted kommune on the map, type its name.

import { useCallback, useMemo } from "react";
import { useQuizState } from "../../hooks/useQuizState";
import { buildNameLookup, buildSortedNames } from "../../utils/featureLookup";
import type { KommuneFeature, QuizState } from "../../types";

export interface ReverseGameState extends QuizState {
    handleNameGuess: (name: string) => void;
    allNames: string[];
    highlightedKommune: string | null;
}

export function useReverseGame(features: KommuneFeature[]): ReverseGameState {
    const quiz = useQuizState(features);

    const nameLookup = useMemo(() => buildNameLookup(features), [features]);
    const allNames = useMemo(() => buildSortedNames(features), [features]);

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