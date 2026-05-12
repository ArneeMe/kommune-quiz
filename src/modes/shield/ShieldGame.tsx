// src/modes/shield/ShieldGame.tsx
// Shield mode: shows a large coat of arms, player types the kommune name.
// Shows correct/wrong feedback below input.

import { NameInput } from "../../components/ui/NameInput";
import { HintBar } from "../../components/ui/HintBar";
import { useNameGuessFeedback } from "../../hooks/useNameGuessFeedback";
import type { ShieldGameState } from "./useShieldGame";

interface ShieldGameProps {
    game: ShieldGameState;
}

export function ShieldGame({ game }: ShieldGameProps) {
    const { feedback, feedbackState, submitNameGuess } = useNameGuessFeedback(game.currentName, game.currentTarget);

    const handleSubmit = (name: string) => {
        submitNameGuess(name, game.handleNameGuess);
    };

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
            {(game.letterBlanks || game.areaHint !== null) && !game.isComplete && (
                <HintBar
                    hints={{ distanceHints: [], letterBlanks: game.letterBlanks, areaHint: game.areaHint }}
                    errorCount={game.currentQuestionErrors}
                    mode="shield"
                />
            )}
        </div>
    );
}
