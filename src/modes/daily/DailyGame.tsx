// src/modes/daily/DailyGame.tsx
// Main daily quiz component. Renders the appropriate mode for each question.

import { useState, useEffect } from "react";
import { GameMap } from "../../components/map/GameMap";
import { NameInput } from "../../components/ui/NameInput";
import { HintBar } from "../../components/ui/HintBar";
import { useNameGuessFeedback } from "../../hooks/useNameGuessFeedback";
import { noop } from "../../utils/featureLookup";
import type { KommuneFeature } from "../../types";
import type { DailyQuizState } from "../../hooks/useDailyQuiz";

interface DailyGameProps {
    allFeatures: KommuneFeature[];
    daily: DailyQuizState;
}

export function DailyGame({ allFeatures, daily }: DailyGameProps) {
    const { feedback: nameFeedback, feedbackState, submitNameGuess } = useNameGuessFeedback(
        daily.currentName,
        daily.currentIndex,
    );

    const handleNameSubmit = (name: string) => {
        submitNameGuess(name, daily.submitNameGuess);
    };

    const [mapWrongGuess, setMapWrongGuess] = useState<{ text: string; questionIndex: number } | null>(null);

    // Auto-clear map wrong-name feedback after 2s
    useEffect(() => {
        if (!mapWrongGuess) return;
        const timer = setTimeout(() => setMapWrongGuess(null), 2000);
        return () => clearTimeout(timer);
    }, [mapWrongGuess]);

    const handleMapGuess = (kommunenummer: string) => {
        if (daily.solved.has(kommunenummer)) return;
        const wasCorrect = kommunenummer === daily.currentKommunenummer;
        daily.submitGuess(kommunenummer);
        if (!wasCorrect) {
            const feature = allFeatures.find((f) => f.properties.kommunenummer === kommunenummer);
            if (feature) {
                setMapWrongGuess({ text: feature.properties.navn, questionIndex: daily.currentIndex });
            }
        }
    };

    const mapFeedback = mapWrongGuess?.questionIndex === daily.currentIndex ? mapWrongGuess : null;

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
                        <HintBar hints={daily.hints} errorCount={currentErrors} mode={currentMode} />
                    </div>
                )}
                {mapFeedback && (
                    <div className="daily-map-wrong-name">
                        {mapFeedback.text}
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
                <HintBar hints={daily.hints} errorCount={currentErrors} mode={currentMode} />
                <div className="shield-game-input">
                    <NameInput
                        names={daily.allNames}
                        onSubmit={handleNameSubmit}
                        disabled={false}
                        feedbackState={feedbackState}
                    />
                </div>
                {nameFeedback && (
                    <div
                        className={`guess-feedback ${nameFeedback.correct ? "guess-feedback-correct" : "guess-feedback-wrong"}`}
                    >
                        {nameFeedback.text}
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
                <HintBar hints={daily.hints} errorCount={currentErrors} mode={currentMode} />
                <NameInput
                    names={daily.allNames}
                    onSubmit={handleNameSubmit}
                    disabled={false}
                    feedbackState={feedbackState}
                />
                {nameFeedback && (
                    <div
                        className={`guess-feedback ${nameFeedback.correct ? "guess-feedback-correct" : "guess-feedback-wrong"}`}
                    >
                        {nameFeedback.text}
                    </div>
                )}
            </div>
        </>
    );
}
