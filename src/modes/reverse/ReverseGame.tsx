// src/modes/reverse/ReverseGame.tsx
// Reverse mode: highlights a kommune on the map, player types its name.
// Input floats over the bottom of the map. Map is passive (not clickable).

import { useState } from "react";
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
    const [lastGuess, setLastGuess] = useState<{ correct: boolean; text: string; target: string | null } | null>(null);

    const handleSubmit = (name: string) => {
        const wasCorrect = name.toLowerCase() === game.currentName.toLowerCase();
        game.handleNameGuess(name);
        setLastGuess({ correct: wasCorrect, text: wasCorrect ? `✓ ${name}` : `✗ ${name}`, target: game.currentTarget });
    };

    const feedback = lastGuess?.target === game.currentTarget ? lastGuess : null;

    const highlighted = new Set(game.solved);
    if (game.highlightedKommune) {
        highlighted.add(game.highlightedKommune);
    }

    return (
        <>
            <GameMap
                allFeatures={allFeatures}
                activeFeatures={activeFeatures}
                lensEnabled={false}
                solved={highlighted}
                onGuess={noop}
                highlightedKommune={game.highlightedKommune}
            />
            <div className="reverse-overlay">
                <NameInput
                    names={game.allNames}
                    onSubmit={handleSubmit}
                    disabled={game.isComplete}
                />
                {feedback && (
                    <div className={`guess-feedback ${feedback.correct ? "guess-feedback-correct" : "guess-feedback-wrong"}`}>
                        {feedback.text}
                    </div>
                )}
            </div>
        </>
    );
}