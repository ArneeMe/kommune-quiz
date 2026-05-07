// src/modes/reverse/useReverseGame.ts
// Reverse mode: see a highlighted kommune on the map, type its name.

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuizState } from "../../hooks/useQuizState";
import { buildNameLookup, buildSortedNames } from "../../utils/featureLookup";
import { computeLetterBlanks, type LetterBlanks } from "../../utils/dailyHints";
import type { KommuneFeature, QuizState } from "../../types";

export interface ReverseGameState extends QuizState {
    handleNameGuess: (name: string) => void;
    allNames: string[];
    highlightedKommune: string | null;
    currentQuestionErrors: number;
    letterBlanks: LetterBlanks | null;
}

export function useReverseGame(features: KommuneFeature[]): ReverseGameState {
    const quiz = useQuizState(features);
    const [currentQuestionErrors, setCurrentQuestionErrors] = useState(0);
    const prevTarget = useRef(quiz.currentTarget);
    const submittingRef = useRef(false);

    // Reset per-question errors when target changes
    useEffect(() => {
        if (prevTarget.current !== quiz.currentTarget) {
            prevTarget.current = quiz.currentTarget;
            setCurrentQuestionErrors(0);
        }
    }, [quiz.currentTarget]);

    const nameLookup = useMemo(() => buildNameLookup(features), [features]);
    const allNames = useMemo(() => buildSortedNames(features), [features]);

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

    const letterBlanks: LetterBlanks | null = currentQuestionErrors >= 1 && quiz.currentName
        ? computeLetterBlanks(quiz.currentName, currentQuestionErrors, quiz.currentKommunenummer)
        : null;

    const baseRestart = quiz.handleRestart;
    const handleRestart = useCallback(() => {
        baseRestart();
        setCurrentQuestionErrors(0);
    }, [baseRestart]);

    return {
        ...quiz,
        handleNameGuess,
        allNames,
        highlightedKommune: quiz.currentTarget,
        currentQuestionErrors,
        letterBlanks,
        handleRestart,
    };
}