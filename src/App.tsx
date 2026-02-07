// src/App.tsx

import { useState } from "react";
import { GameMap } from "./components/GameMap";
import { GameHeader } from "./components/GameHeader";
import { useMapData } from "./hooks/useMapData";
import { useGameState } from "./hooks/useGameState";
import "./styles/index.css";

export default function App() {
    const [lensEnabled, setLensEnabled] = useState(false);
    const { features } = useMapData();
    const game = useGameState(features);

    return (
        <div className="app">
            <h1 className="app-title">Kommune Quiz</h1>
            <GameHeader
                currentName={game.currentName}
                currentIndex={game.currentIndex}
                total={game.total}
                errors={game.errors}
                isComplete={game.isComplete}
                onSkip={game.handleSkip}
            />
            <button
                className="lens-toggle"
                onClick={() => setLensEnabled((prev) => !prev)}
            >
                {lensEnabled ? "🔍 Lens On" : "🔍 Lens Off"}
            </button>
            <GameMap
                lensEnabled={lensEnabled}
                solved={game.solved}
                onGuess={game.handleGuess}
            />
        </div>
    );
}