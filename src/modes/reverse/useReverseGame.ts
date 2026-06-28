// src/modes/reverse/useReverseGame.ts
// Reverse mode: see a highlighted kommune on the map, type its name.

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuizState } from "../../hooks/useQuizState";
import { buildFeatureMap, buildNameLookup, buildSortedNames } from "../../utils/featureLookup";
import { computeLetterBlanks, type LetterBlanks } from "../../utils/dailyHints";
import { getDistanceHint } from "../../utils/geoDistance";
import type { DistanceHint } from "../map/useMapGame";
import type { KommuneFeature, QuizState } from "../../types";

export interface ReverseGameState extends QuizState {
    handleNameGuess: (name: string) => void;
    allNames: string[];
    highlightedKommune: string | null;
    currentQuestionErrors: number;
    letterBlanks: LetterBlanks | null;
    distanceHints: DistanceHint[];
}

export function useReverseGame(features: KommuneFeature[]): ReverseGameState {
    const quiz = useQuizState(features);
    const [currentQuestionErrors, setCurrentQuestionErrors] = useState(0);
    const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
    const prevTarget = useRef(quiz.currentTarget);
    const submittingRef = useRef(false);

    // Reset per-question state when target changes
    useEffect(() => {
        if (prevTarget.current !== quiz.currentTarget) {
            prevTarget.current = quiz.currentTarget;
            setCurrentQuestionErrors(0);
            setWrongGuesses([]);
        }
    }, [quiz.currentTarget]);

    const nameLookup = useMemo(() => buildNameLookup(features), [features]);
    const allNames = useMemo(() => buildSortedNames(features), [features]);
    const featureMap = useMemo(() => buildFeatureMap(features), [features]);

    const handleNameGuess = useCallback((name: string) => {
        if (quiz.isComplete) return;
        if (submittingRef.current) return;
        submittingRef.current = true;

        const kommunenummer = nameLookup.get(name.toLowerCase());
        if (kommunenummer === quiz.currentTarget) {
            quiz.markSolved(kommunenummer);
        } else {
            if (kommunenummer) setWrongGuesses((prev) => [...prev, kommunenummer]);
            setCurrentQuestionErrors((prev) => prev + 1);
            quiz.markError();
        }

        requestAnimationFrame(() => { submittingRef.current = false; });
    }, [quiz, nameLookup]);

    const letterBlanks: LetterBlanks | null = currentQuestionErrors >= 1 && quiz.currentName
        ? computeLetterBlanks(quiz.currentName, currentQuestionErrors, quiz.currentKommunenummer, { sequential: true })
        : null;

    const distanceHints = useMemo<DistanceHint[]>(() => {
        if (!quiz.currentTarget) return [];
        const target = featureMap.get(quiz.currentTarget);
        if (!target) return [];
        return wrongGuesses
            .map((kn) => {
                const from = featureMap.get(kn);
                if (!from) return null;
                const { distance, arrow, proximity } = getDistanceHint(from, target);
                return { kommunenummer: kn, arrow, distanceKm: distance, guessedName: from.properties.navn, proximity };
            })
            .filter((h): h is DistanceHint => h !== null);
    }, [wrongGuesses, quiz.currentTarget, featureMap]);

    const baseRestart = quiz.handleRestart;
    const handleRestart = useCallback(() => {
        baseRestart();
        setCurrentQuestionErrors(0);
        setWrongGuesses([]);
    }, [baseRestart]);

    return {
        ...quiz,
        handleNameGuess,
        allNames,
        highlightedKommune: quiz.currentTarget,
        currentQuestionErrors,
        letterBlanks,
        distanceHints,
        handleRestart,
    };
}