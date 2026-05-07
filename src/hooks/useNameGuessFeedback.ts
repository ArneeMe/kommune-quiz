import { useState } from "react";
import { useFeedback, type FeedbackState } from "./useFeedback";

interface GuessFeedback {
    correct: boolean;
    text: string;
}

export function useNameGuessFeedback(currentName: string, targetKey: string | number | null) {
    const [lastGuess, setLastGuess] = useState<{ feedback: GuessFeedback; targetKey: string | number | null } | null>(null);
    const { feedbackState, setFeedbackState } = useFeedback();

    const feedback = lastGuess?.targetKey === targetKey ? lastGuess.feedback : null;

    const submitNameGuess = (name: string, onGuess: (name: string) => void) => {
        const wasCorrect = name.toLowerCase() === currentName.toLowerCase();
        onGuess(name);
        setLastGuess({
            feedback: { correct: wasCorrect, text: wasCorrect ? `✓ ${name}` : `✗ ${name}` },
            targetKey,
        });
        setFeedbackState(wasCorrect ? "correct" : "wrong");
    };

    return { feedback, feedbackState, submitNameGuess } as const;
}

export type { GuessFeedback, FeedbackState };
