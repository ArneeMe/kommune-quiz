// src/App.tsx
// Root orchestrator. Loads data once, manages fylke selection,
// filters features, and wires game state + timer to UI.

import { useState, useMemo } from "react";
import { useMapData } from "./hooks/useMapData";
import { useGameState } from "./hooks/useGameState";
import { useTimer, formatTime } from "./hooks/useTimer";
import { GameMap } from "./components/map/GameMap";
import { GameHeader } from "./components/ui/GameHeader";
import { LensToggle } from "./components/ui/LensToggle";
import { FylkeSelector } from "./components/ui/FylkeSelector";
import "./styles/index.css";

export default function App() {
    const { features } = useMapData();
    const [selectedFylke, setSelectedFylke] = useState<string | null>(null);
    const [lensEnabled, setLensEnabled] = useState(false);
    const [fylkeHintEnabled, setFylkeHintEnabled] = useState(false);

    // Derive unique sorted fylke list from data
    const fylker = useMemo(() => {
        const map = new Map<string, string>();
        for (const f of features) {
            map.set(f.properties.fylkesnummer, f.properties.fylkenavn);
        }
        return Array.from(map, ([fylkesnummer, fylkenavn]) => ({ fylkesnummer, fylkenavn }))
            .sort((a, b) => a.fylkenavn.localeCompare(b.fylkenavn, "no"));
    }, [features]);

    // Filter features based on selected fylke
    const activeFeatures = useMemo(() =>
            selectedFylke
                ? features.filter((f) => f.properties.fylkesnummer === selectedFylke)
                : features,
        [features, selectedFylke]
    );

    // Game state resets when activeFeatures reference changes (fylke switch triggers reshuffle)
    const game = useGameState(activeFeatures);
    const { elapsed, reset: resetTimer } = useTimer(!game.isComplete);

    const handleRestart = () => {
        game.handleRestart();
        resetTimer();
    };

    const handleFylkeChange = (fylkesnummer: string | null) => {
        setSelectedFylke(fylkesnummer);
        resetTimer();
    };

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
                <FylkeSelector
                    fylker={fylker}
                    selected={selectedFylke}
                    onChange={handleFylkeChange}
                />
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
                allFeatures={features}
                activeFeatures={activeFeatures}
                lensEnabled={lensEnabled}
                solved={game.solved}
                onGuess={game.handleGuess}
            />
        </div>
    );
}