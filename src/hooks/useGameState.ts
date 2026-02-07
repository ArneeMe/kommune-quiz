// src/hooks/useGameState.ts

import { useState, useMemo, useCallback } from "react";
import type { KommuneFeature } from "../types";

function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function useGameState(features: KommuneFeature[]) {
    const [order, setOrder] = useState(() =>
        shuffle(features.map((f) => f.properties.kommunenummer))
    );

    const nameMap = useMemo(
        () => new Map(features.map((f) => [f.properties.kommunenummer, f.properties.navn])),
        [features]
    );

    const [currentIndex, setCurrentIndex] = useState(0);
    const [errors, setErrors] = useState(0);
    const [solved, setSolved] = useState<Set<string>>(() => new Set());

    const currentTarget = order[currentIndex] ?? null;
    const currentName = currentTarget ? nameMap.get(currentTarget) ?? "" : "";
    const total = order.length;
    const isComplete = currentIndex >= total;

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

    return {
        currentName,
        currentIndex,
        errors,
        total: features.length,
        solved,
        isComplete: solved.size >= features.length,
        handleGuess,
        handleSkip,
    };
}