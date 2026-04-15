// src/modes/reverse/useReverseGame.ts
// Reverse mode: see a highlighted kommune on the map, type its name.

import { useCallback, useMemo, useState, useRef } from "react";
import { useQuizState } from "../../hooks/useQuizState";
import type { KommuneFeature, QuizState } from "../../types";

const MAX_ERRORS_PER_QUESTION = 3;

export interface ReverseGameState extends QuizState {
    handleNameGuess: (name: string) => void;
    allNames: string[];
    highlightedKommune: string | null;
    currentQuestionErrors: number;
}

export function useReverseGame(features: KommuneFeature[]): ReverseGameState {
    const quiz = useQuizState(features);
    const [currentQuestionErrors, setCurrentQuestionErrors] = useState(0);
    const prevTargetRef = useRef(quiz.currentTarget);

    // Reset per-question errors when target changes
    if (prevTargetRef.current !== quiz.currentTarget) {
        prevTargetRef.current = quiz.currentTarget;
        setCurrentQuestionErrors(0);
    }

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
            if (currentQuestionErrors + 1 >= MAX_ERRORS_PER_QUESTION && quiz.currentTarget) {
                // Auto-advance after 3 wrong guesses
                quiz.markSolved(quiz.currentTarget);
            } else {
                setCurrentQuestionErrors(prev => prev + 1);
            }
        }
    }, [quiz.currentTarget, quiz.isComplete, quiz.markSolved, quiz.markError, nameLookup, currentQuestionErrors]);

    return {
        ...quiz,
        handleNameGuess,
        allNames,
        highlightedKommune: quiz.currentTarget,
        currentQuestionErrors,
    };
}
