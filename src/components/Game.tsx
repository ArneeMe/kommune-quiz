// src/components/Game.tsx
// Encapsulates game state + timer for a given set of features.
// Designed to be remounted (via key prop) when the feature set changes (e.g. fylke switch).

import { useState, useCallback } from "react";
import { useGameState } from "../hooks/useGameState";
import { useTimer, formatTime } from "../hooks/useTimer";
import { GameMap } from "./map/GameMap";
import { GameHeader } from "./ui/GameHeader";
import { LensToggle } from "./ui/LensToggle";
import type { KommuneFeature } from "../types";

interface GameProps {
    features: KommuneFeature[];
}

export function Game({ features }: GameProps) {
    const game = useGameState(features);
    const { elapsed, reset: resetTimer } = useTimer(!game.isComplete);
    const [lensEnabled, setLensEnabled] = useState(false);
    const [fylkeHintEnabled, setFylkeHintEnabled] = useState(false);

    const handleRestart = useCallback(() => {
        game.handleRestart();
        resetTimer();
    }, [game.handleRestart, resetTimer]);

    return (
        <>
            <GameHeader
                currentName={game.currentName}
                currentFylke={game.currentFylke}
                showFylke={fylkeHintEnabled}
                currentIndex={game.currentIndex}
                total={game.total}
                errors={game.errors}
                elapsed={formatTime(elapsed)}
                isComplete={game.isComplete}
                onSkip={game.handleSkip}
                onRestart={handleRestart}
            />
            <div className="toolbar">
                <LensToggle
                    label={lensEnabled ? "🔍 Lens On" : "🔍 Lens Off"}
                    enabled={lensEnabled}
                    onToggle={() => setLensEnabled((prev) => !prev)}
                />
                <LensToggle
                    label={fylkeHintEnabled ? "🗺️ Fylke On" : "🗺️ Fylke Off"}
                    enabled={fylkeHintEnabled}
                    onToggle={() => setFylkeHintEnabled((prev) => !prev)}
                />
            </div>
            <GameMap
                features={features}
                lensEnabled={lensEnabled}
                solved={game.solved}
                onGuess={game.handleGuess}
            />
        </>
    );
}