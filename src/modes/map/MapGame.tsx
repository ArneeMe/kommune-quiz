// src/modes/map/MapGame.tsx
// Map mode: shows kommune name, player clicks on the map.

import { GameMap } from "../../components/map/GameMap";
import type { KommuneFeature } from "../../types";
import type { MapGameState } from "./useMapGame";

interface MapGameProps {
    allFeatures: KommuneFeature[];
    activeFeatures: KommuneFeature[];
    game: MapGameState;
}

export function MapGame({ allFeatures, activeFeatures, game }: MapGameProps) {
    // Show arrow hint after 2+ errors on the same question
    const showArrowHint = game.currentQuestionErrors >= 2 && game.lastWrongKommune && game.currentTarget;

    return (
        <GameMap
            allFeatures={allFeatures}
            activeFeatures={activeFeatures}
            solved={game.solved}
            onGuess={game.handleGuess}
            justSolved={game.justSolved}
            wrongGuess={game.wrongGuess}
            arrowHint={showArrowHint ? {
                fromKommune: game.lastWrongKommune!,
                toKommune: game.currentTarget!,
            } : undefined}
        />
    );
}
