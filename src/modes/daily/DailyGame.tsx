// src/modes/daily/DailyGame.tsx
// Main daily quiz component. Renders the appropriate mode for each question.

import { useState, useEffect } from "react";
import { GameMap } from "../../components/map/GameMap";
import { NameInput } from "../../components/ui/NameInput";
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

    // Auto-clear map wrong-name feedback after 2s
    useEffect(() => {
        if (!lastGuess || lastGuess.correct) return;
        const timer = setTimeout(() => setLastGuess(null), 2000);
        return () => clearTimeout(timer);
    }, [lastGuess]);

    const handleMapGuess = (kommunenummer: string) => {
        if (daily.solved.has(kommunenummer)) return;
        const wasCorrect = kommunenummer === daily.currentKommunenummer;
        daily.submitGuess(kommunenummer);
        if (!wasCorrect) {
            // Look up the name of the wrong guess for learning
            const feature = allFeatures.find((f) => f.properties.kommunenummer === kommunenummer);
            if (feature) {
                setLastGuess({
                    correct: false,
                    text: feature.properties.navn,
                    questionIndex: daily.currentIndex,
                });
            }
        }
    };

    // Auto-clear feedback when question changes
    const feedback =
        lastGuess?.questionIndex === daily.currentIndex ? lastGuess : null;

    if (daily.isComplete || !daily.currentQuestion) return null;

    const { currentMode, currentKommunenummer } = daily;

    // For map mode: show solved kommuner from previous daily questions
    const mapSolved = daily.solved;

    if (currentMode === "map") {
        return (
            <>
                <GameMap
                    allFeatures={allFeatures}
                    activeFeatures={allFeatures}
                    solved={mapSolved}
                    onGuess={handleMapGuess}
                />
                {feedback && !feedback.correct && (
                    <div className="daily-map-wrong-name">
                        {feedback.text}
                    </div>
                )}
            </>
        );
    }

    if (currentMode === "shield") {
        return (
            <div className="shield-game">
                <div className="shield-game-prompt">
                    {/^\d+$/.test(currentKommunenummer) && (
                    <img
                        src={`/shields/${currentKommunenummer}.png`}
                        alt="Kommunev\u00e5pen"
                        className="shield-game-image"
                    />
                    )}
                </div>
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
