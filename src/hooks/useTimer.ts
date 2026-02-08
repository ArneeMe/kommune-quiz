// src/hooks/useTimer.ts
// Stopwatch hook: tracks elapsed seconds. Starts on mount, stops when told.
// Returns elapsed seconds and a reset function.

import { useState, useEffect, useCallback, useRef } from "react";

export function useTimer(isRunning: boolean) {
    const [elapsed, setElapsed] = useState(0);
    const startTime = useRef(Date.now());

    useEffect(() => {
        if (!isRunning) return;

        // Sync start time when resuming
        startTime.current = Date.now() - elapsed * 1000;

        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    const reset = useCallback(() => {
        startTime.current = Date.now();
        setElapsed(0);
    }, []);

    return { elapsed, reset };
}

/** Format seconds as mm:ss */
export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}