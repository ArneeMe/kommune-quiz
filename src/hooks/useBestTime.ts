// src/hooks/useBestTime.ts
// Tracks the personal best for the active freeplay mode/fylke combination
// and records a new one when the round completes.

import { useState, useEffect, useRef } from "react";
import { bestTimeKey, loadBestTime, saveBestTime, isBetter, type BestTime } from "../utils/bestTimes";
import { getTodayDateKey } from "../utils/seededRandom";
import type { GameMode } from "../types";

interface UseBestTimeResult {
    /** Current record for the active mode/fylke (includes a just-set one). */
    best: BestTime | null;
    /** True when the round that just completed set a new record. */
    isNewRecord: boolean;
}

export function useBestTime(
    mode: GameMode,
    fylkesnummer: string | null,
    isComplete: boolean,
    elapsedSeconds: number,
    errors: number,
    total: number,
): UseBestTimeResult {
    const key = bestTimeKey(mode, fylkesnummer);
    const [best, setBest] = useState<BestTime | null>(() => loadBestTime(key));
    const [isNewRecord, setIsNewRecord] = useState(false);
    const recordedRef = useRef(false);

    useEffect(() => {
        setBest(loadBestTime(key));
        setIsNewRecord(false);
        recordedRef.current = false;
    }, [key]);

    useEffect(() => {
        // total === 0 guards the empty-features state, where isComplete is
        // vacuously true before map data loads.
        if (!isComplete || total === 0) {
            recordedRef.current = false;
            setIsNewRecord(false);
            return;
        }
        if (recordedRef.current) return;
        recordedRef.current = true;

        const candidate: BestTime = { timeSeconds: elapsedSeconds, errors, dateKey: getTodayDateKey() };
        if (isBetter(candidate, loadBestTime(key))) {
            saveBestTime(key, candidate);
            setBest(candidate);
            setIsNewRecord(true);
        }
    }, [isComplete, total, elapsedSeconds, errors, key]);

    return { best, isNewRecord };
}
