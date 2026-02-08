// src/App.tsx
// Root orchestrator. Loads data once, creates game state, wires everything together.
// All state lives in hooks; components below are purely presentational.

import { useState, useCallback } from "react";
import { useMapData } from "./hooks/useMapData";
import { useGameState } from "./hooks/useGameState";
import { useTimer, formatTime } from "./hooks/useTimer";
import { GameMap } from "./components/map/GameMap";
import { GameHeader } from "./components/ui/GameHeader";
import { LensToggle } from "./components/ui/LensToggle";
import "./styles/index.css";

export default function App() {
    const { features } = useMapData();
    const game = useGameState(features);
    const { elapsed, reset: resetTimer } = useTimer(!game.isComplete);
    const [lensEnabled, setLensEnabled] = useState(false);
    const [fylkeHintEnabled, setFylkeHintEnabled] = useState(false);

    const handleRestart = useCallback(() => {
        game.handleRestart();
        resetTimer();
    }, [game.handleRestart, resetTimer]);

    return (
        <div className="app">
            <h1 className="app-title">Kommune Quiz</h1>
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
        </div>
    );
}