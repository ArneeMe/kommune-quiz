// src/modes/reverse/ReverseGame.tsx
// Reverse mode: highlights a kommune on the map, player types its name.
// Input floats over the bottom of the map. Map is passive (not clickable).

import { GameMap } from "../../components/map/GameMap";
import { NameInput } from "../../components/ui/NameInput";
import { HintBar, PrefixHint } from "../../components/ui/HintBar";
import { useNameGuessFeedback } from "../../hooks/useNameGuessFeedback";
import { noop } from "../../utils/featureLookup";
import type { KommuneFeature } from "../../types";
import type { ReverseGameState } from "./useReverseGame";

interface ReverseGameProps {
    allFeatures: KommuneFeature[];
    activeFeatures: KommuneFeature[];
    game: ReverseGameState;
}

export function ReverseGame({ allFeatures, activeFeatures, game }: ReverseGameProps) {
    const { feedback, feedbackState, submitNameGuess } = useNameGuessFeedback(game.currentName, game.currentTarget);

    const handleSubmit = (name: string) => {
        submitNameGuess(name, game.handleNameGuess);
    };

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
            {!game.isComplete && game.distanceHints.length > 0 && (
                <div className="reverse-history-floating">
                    <HintBar
                        hints={{ distanceHints: game.distanceHints, letterBlanks: null, areaHint: null }}
                        errorCount={game.currentQuestionErrors}
                        mode="reverse"
                    />
                </div>
            )}
            <div className="reverse-overlay">
                {game.letterBlanks && !game.isComplete && (
                    <PrefixHint slots={game.letterBlanks.slots} />
                )}
                <NameInput
                    names={game.allNames}
                    onSubmit={handleSubmit}
                    disabled={game.isComplete}
                    feedbackState={feedbackState}
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
