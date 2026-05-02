// src/modes/daily/DailyGame.tsx
// Main daily quiz component. Renders the appropriate mode for each question.

import { useState, useEffect } from "react";
import { GameMap } from "../../components/map/GameMap";
import { NameInput } from "../../components/ui/NameInput";
import { DailyHintBar } from "./DailyHintBar";
import { useFeedback } from "../../hooks/useFeedback";
import { noop } from "../../utils/featureLookup";
import type { KommuneFeature } from "../../types";
import type { DailyQuizState } from "../../hooks/useDailyQuiz";

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
    const { feedbackState, setFeedbackState } = useFeedback();

    const handleNameSubmit = (name: string) => {
        const wasCorrect = name.toLowerCase() === daily.currentName.toLowerCase();
        daily.submitNameGuess(name);
        setLastGuess({
            correct: wasCorrect,
            text: wasCorrect ? `✓ ${name}` : `✗ ${name}`,
            questionIndex: daily.currentIndex,
        });
        setFeedbackState(wasCorrect ? "correct" : "wrong");
    };

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

    const feedback =
        lastGuess?.questionIndex === daily.currentIndex ? lastGuess : null;

    if (daily.isComplete || !daily.currentQuestion) return null;

    const { currentMode, currentKommunenummer } = daily;
    const currentErrors = daily.perQuestionErrors[daily.currentIndex] ?? 0;
    const mapSolved = daily.solved;

    if (currentMode === "map") {
        return (
            <>
                <GameMap
                    allFeatures={allFeatures}
                    activeFeatures={allFeatures}
                    solved={mapSolved}
                    onGuess={handleMapGuess}
                    resetKey={daily.currentIndex}
                />
                {/* Floating guess history for mobile (desktop hints are in command bar) */}
                {currentErrors > 0 && (
                    <div className="daily-hint-row-floating">
                        <DailyHintBar hints={daily.hints} errorCount={currentErrors} mode={currentMode} />
                    </div>
                )}
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
                        alt="Kommunevåpen"
                        className="shield-game-image"
                    />
                    )}
                </div>
                <DailyHintBar hints={daily.hints} errorCount={currentErrors} mode={currentMode} />
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

    // Reverse mode: highlighted kommune on map + name input + letter blanks
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
                resetKey={daily.currentIndex}
            />
            <div className="reverse-overlay">
                <DailyHintBar hints={daily.hints} errorCount={currentErrors} mode={currentMode} />
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
