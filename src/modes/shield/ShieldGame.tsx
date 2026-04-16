// src/modes/shield/ShieldGame.tsx
// Shield mode: shows a large coat of arms, player types the kommune name.
// Shows correct/wrong feedback below input.

import { useState } from "react";
import { NameInput } from "../../components/ui/NameInput";
import { useFeedback } from "../../hooks/useFeedback";
import type { ShieldGameState } from "./useShieldGame";

interface ShieldGameProps {
    game: ShieldGameState;
}

export function ShieldGame({ game }: ShieldGameProps) {
    const [lastGuess, setLastGuess] = useState<{ correct: boolean; text: string; target: string | null } | null>(null);
    const { feedbackState, setFeedbackState } = useFeedback();

    const handleSubmit = (name: string) => {
        const wasCorrect = name.toLowerCase() === game.currentName.toLowerCase();
        game.handleNameGuess(name);
        setLastGuess({ correct: wasCorrect, text: wasCorrect ? `✓ ${name}` : `✗ ${name}`, target: game.currentTarget });
        setFeedbackState(wasCorrect ? "correct" : "wrong");
    };

    // Derive feedback — auto-clears when target changes
    const feedback = lastGuess?.target === game.currentTarget ? lastGuess : null;

    return (
        <div className="shield-game">
            <div className="shield-game-prompt">
                {!game.isComplete && game.currentKommunenummer && /^\d+$/.test(game.currentKommunenummer) && (
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
                    feedbackState={feedbackState}
                />
            </div>
            {feedback && (
                <div className={`guess-feedback ${feedback.correct ? "guess-feedback-correct" : "guess-feedback-wrong"}`}>
                    {feedback.text}
                </div>
            )}
            {game.letterHint && !game.isComplete && (
                <div className="shield-hint">
                    Starter med <strong>{game.letterHint}</strong>
                </div>
            )}
        </div>
    );
}
