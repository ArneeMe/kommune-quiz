// src/hooks/useFeedback.ts
// Reusable hook for correct/wrong feedback state with auto-clear timer.

import { useState, useEffect } from "react";

export type FeedbackState = "correct" | "wrong" | null;

export function useFeedback(duration = 400) {
    const [feedbackState, setFeedbackState] = useState<FeedbackState>(null);

    useEffect(() => {
        if (!feedbackState) return;
        const timer = setTimeout(() => setFeedbackState(null), duration);
        return () => clearTimeout(timer);
    }, [feedbackState, duration]);

    return { feedbackState, setFeedbackState };
}
