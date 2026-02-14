// src/hooks/useGameState.ts
// Core game logic: shuffles kommuner, tracks current target, score, errors, skip.
// Accepts features array so it doesn't depend on useMapData directly.

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { KommuneFeature, GameState } from "../types";

function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function useGameState(features: KommuneFeature[]): GameState {
    const [order, setOrder] = useState(() =>
        shuffle(features.map((f) => f.properties.kommunenummer))
    );

    const nameMap = useMemo(
        () => new Map(features.map((f) => [f.properties.kommunenummer, f.properties.navn])),
        [features]
    );

    const fylkeMap = useMemo(
        () => new Map(features.map((f) => [f.properties.kommunenummer, f.properties.fylkenavn])),
        [features]
    );

    const [currentIndex, setCurrentIndex] = useState(0);
    const [errors, setErrors] = useState(0);
    const [solved, setSolved] = useState<Set<string>>(() => new Set());

    // Auto-reset when features changes (e.g. fylke switch)
    const prevFeaturesRef = useRef(features);
    useEffect(() => {
        if (prevFeaturesRef.current !== features) {
            prevFeaturesRef.current = features;
            setOrder(shuffle(features.map((f) => f.properties.kommunenummer)));
            setCurrentIndex(0);
            setErrors(0);
            setSolved(new Set());
        }
    }, [features]);

    const currentTarget = order[currentIndex] ?? null;
    const currentName = currentTarget ? nameMap.get(currentTarget) ?? "" : "";
    const currentFylke = currentTarget ? fylkeMap.get(currentTarget) ?? "" : "";
    const currentKommunenummer = currentTarget ?? "";

    const isComplete = solved.size >= features.length;

    const handleGuess = useCallback((kommunenummer: string) => {
        if (isComplete) return;
        if (solved.has(kommunenummer)) return;

        if (kommunenummer === currentTarget) {
            setSolved((prev) => new Set(prev).add(kommunenummer));
            setCurrentIndex((prev) => prev + 1);
        } else {
            setErrors((prev) => prev + 1);
        }
    }, [currentTarget, isComplete, solved]);

    const handleSkip = useCallback(() => {
        if (isComplete || !currentTarget) return;
        setOrder((prev) => [...prev, currentTarget]);
        setCurrentIndex((prev) => prev + 1);
    }, [isComplete, currentTarget]);

    const handleRestart = useCallback(() => {
        setOrder(shuffle(features.map((f) => f.properties.kommunenummer)));
        setCurrentIndex(0);
        setErrors(0);
        setSolved(new Set());
    }, [features]);

    return {
        currentName,
        currentFylke,
        currentKommunenummer,
        currentIndex,
        errors,
        total: features.length,
        isComplete,
        solved,
        handleGuess,
        handleSkip,
        handleRestart,
    };
}