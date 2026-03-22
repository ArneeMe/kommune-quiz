// src/modes/daily/DailyGame.tsx
// Main daily quiz component. Renders the appropriate mode for each question.

import { useState, useEffect } from "react";
import { GameMap } from "../../components/map/GameMap";
import { NameInput } from "../../components/ui/NameInput";
import { DailyHintBar } from "./DailyHintBar";
import type { KommuneFeature } from "../../types";
import type { DailyQuizState } from "../../hooks/useDailyQuiz";

const noop = () => {};

interface DailyGameProps {
    allFeatures: KommuneFeature[];
    daily: DailyQuizState;
}

export function DailyGame({ allFeatures, daily }: DailyGameProps) {
    const [lastGuess, setLastGuess] = useState<{
        correct: boolean;
        text: string;
        questionIndex: number;
    } | null>(null);
    const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | null>(null);

    const handleNameSubmit = (name: string) => {
        const wasCorrect = name.toLowerCase() === daily.currentName.toLowerCase();
        daily.submitNameGuess(name);
        setLastGuess({
            correct: wasCorrect,
            text: wasCorrect ? `\u2713 ${name}` : `\u2717 ${name}`,
            questionIndex: daily.currentIndex,
        });
        setFeedbackState(wasCorrect ? "correct" : "wrong");
    };

    useEffect(() => {
        if (!feedbackState) return;
        const timer = setTimeout(() => setFeedbackState(null), 400);
        return () => clearTimeout(timer);
    }, [feedbackState]);

    const handleMapGuess = (kommunenummer: string) => {
        if (daily.solved.has(kommunenummer)) return;
        daily.submitGuess(kommunenummer);
    };

    // Auto-clear feedback when question changes
    const feedback =
        lastGuess?.questionIndex === daily.currentIndex ? lastGuess : null;

    const currentErrors = daily.perQuestionErrors[daily.currentIndex] ?? 0;

    if (daily.isComplete || !daily.currentQuestion) return null;

    const { currentMode, currentKommunenummer } = daily;

    // For map mode: show solved kommuner from previous daily questions
    const mapSolved = daily.solved;

    if (currentMode === "map") {
        return (
            <GameMap
                allFeatures={allFeatures}
                activeFeatures={allFeatures}
                solved={mapSolved}
                onGuess={handleMapGuess}
            />
        );
    }

    if (currentMode === "shield") {
        return (
            <div className="shield-game">
                <div className="shield-game-prompt">
                    <img
                        src={`/shields/${currentKommunenummer}.png`}
                        alt="Kommunev\u00e5pen"
                        className="shield-game-image"
                    />
                </div>
                <DailyHintBar hints={daily.hints} errorCount={currentErrors} />
                <div className="shield-game-input">
                    <NameInput
                        names={daily.allNames}
                        onSubmit={handleNameSubmit}
                        disabled={false}
                        feedbackState={feedbackState}
                    />
                </div>
                {feedback && (
                    <div
                        className={`guess-feedback ${feedback.correct ? "guess-feedback-correct" : "guess-feedback-wrong"}`}
                    >
                        {feedback.text}
                    </div>
                )}
            </div>
        );
    }

    // Reverse mode: show highlighted kommune on map + name input
    const highlighted = new Set(mapSolved);
    highlighted.add(currentKommunenummer);

    return (
        <>
            <GameMap
                allFeatures={allFeatures}
                activeFeatures={allFeatures}
                solved={highlighted}
                onGuess={noop}
                highlightedKommune={currentKommunenummer}
            />
            <div className="reverse-overlay">
                <DailyHintBar hints={daily.hints} errorCount={currentErrors} />
                <NameInput
                    names={daily.allNames}
                    onSubmit={handleNameSubmit}
                    disabled={false}
                    feedbackState={feedbackState}
                />
                {feedback && (
                    <div
                        className={`guess-feedback ${feedback.correct ? "guess-feedback-correct" : "guess-feedback-wrong"}`}
                    >
                        {feedback.text}
                    </div>
                )}
            </div>
        </>
    );
}
