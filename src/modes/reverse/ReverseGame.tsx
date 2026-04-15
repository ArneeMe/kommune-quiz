// src/modes/reverse/ReverseGame.tsx
// Reverse mode: highlights a kommune on the map, player types its name.
// Input floats over the bottom of the map. Map is passive (not clickable).

import { useState, useEffect } from "react";
import { GameMap } from "../../components/map/GameMap";
import { NameInput } from "../../components/ui/NameInput";
import type { KommuneFeature } from "../../types";
import type { ReverseGameState } from "./useReverseGame";

const noop = () => {};

interface ReverseGameProps {
    allFeatures: KommuneFeature[];
    activeFeatures: KommuneFeature[];
    game: ReverseGameState;
}

export function ReverseGame({ allFeatures, activeFeatures, game }: ReverseGameProps) {
    const [lastGuess, setLastGuess] = useState<{ correct: boolean; text: string; autoAdvanced: boolean } | null>(null);
    const [feedbackState, setFeedbackState] = useState<"correct" | "wrong" | null>(null);

    const handleSubmit = (name: string) => {
        const wasCorrect = name.toLowerCase() === game.currentName.toLowerCase();
        const willAutoAdvance = !wasCorrect && game.currentQuestionErrors >= 2;
        const correctName = game.currentName;

        game.handleNameGuess(name);

        if (willAutoAdvance) {
            setLastGuess({ correct: false, text: `✗ ${name} — Riktig: ${correctName}`, autoAdvanced: true });
        } else {
            setLastGuess({ correct: wasCorrect, text: wasCorrect ? `✓ ${name}` : `✗ ${name}`, autoAdvanced: false });
        }
        setFeedbackState(wasCorrect ? "correct" : "wrong");
    };

    useEffect(() => {
        if (!feedbackState) return;
        const duration = lastGuess?.autoAdvanced ? 1500 : 400;
        const timer = setTimeout(() => setFeedbackState(null), duration);
        return () => clearTimeout(timer);
    }, [feedbackState, lastGuess?.autoAdvanced]);

    const highlighted = new Set(game.solved);
    if (game.highlightedKommune) {
        highlighted.add(game.highlightedKommune);
    }

    return (
        <>
            <GameMap
                allFeatures={allFeatures}
                activeFeatures={activeFeatures}
                solved={highlighted}
                onGuess={noop}
                highlightedKommune={game.highlightedKommune}
            />
            <div className="reverse-overlay">
                <NameInput
                    names={game.allNames}
                    onSubmit={handleSubmit}
                    disabled={game.isComplete}
                    feedbackState={feedbackState}
                />
                {feedbackState && lastGuess && (
                    <div className={`guess-feedback ${lastGuess.correct ? "guess-feedback-correct" : "guess-feedback-wrong"}`}>
                        {lastGuess.text}
                    </div>
                )}
            </div>
        </>
    );
}
