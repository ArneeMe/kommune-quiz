// src/modes/shield/ShieldGame.tsx
// Shield mode: shows a large coat of arms, player types the kommune name.
// Shows correct/wrong feedback below input.

import { useState } from "react";
import { NameInput } from "../../components/ui/NameInput";
import type { ShieldGameState } from "./useShieldGame";

interface ShieldGameProps {
    game: ShieldGameState;
}

export function ShieldGame({ game }: ShieldGameProps) {
// Replace the useEffect + useState pattern with:
    const [lastGuess, setLastGuess] = useState<{ correct: boolean; text: string; target: string | null } | null>(null);

    const handleSubmit = (name: string) => {
        const wasCorrect = name.toLowerCase() === game.currentName.toLowerCase();
        game.handleNameGuess(name);
        setLastGuess({ correct: wasCorrect, text: wasCorrect ? `✓ ${name}` : `✗ ${name}`, target: game.currentTarget });
    };

    // Derive feedback — auto-clears when target changes
    const feedback = lastGuess?.target === game.currentTarget ? lastGuess : null;

    return (
        <div className="shield-game">
            <div className="shield-game-prompt">
                {!game.isComplete && game.currentKommunenummer && (
                    <img
                        src={`/shields/${game.currentKommunenummer}.png`}
                        alt="Kommunevåpen"
                        className="shield-game-image"
                    />
                )}
            </div>
            <div className="shield-game-input">
                <NameInput
                    names={game.allNames}
                    onSubmit={handleSubmit}
                    disabled={game.isComplete}
                />
            </div>
            {feedback && (
                <div className={`guess-feedback ${feedback.correct ? "guess-feedback-correct" : "guess-feedback-wrong"}`}>
                    {feedback.text}
                </div>
            )}
        </div>
    );
}