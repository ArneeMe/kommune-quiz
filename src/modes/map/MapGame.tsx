// src/modes/map/MapGame.tsx
// Map mode: shows kommune name, player clicks on the map.

import { GameMap } from "../../components/map/GameMap";
import type { KommuneFeature } from "../../types";
import type { MapGameState } from "./useMapGame";

interface MapGameProps {
    allFeatures: KommuneFeature[];
    activeFeatures: KommuneFeature[];
    lensEnabled: boolean;
    game: MapGameState;
}

export function MapGame({ allFeatures, activeFeatures, lensEnabled, game }: MapGameProps) {
    return (
        <GameMap
            allFeatures={allFeatures}
            activeFeatures={activeFeatures}
            lensEnabled={lensEnabled}
            solved={game.solved}
            onGuess={game.handleGuess}
            justSolved={game.justSolved}
            wrongGuess={game.wrongGuess}
        />
    );
}
