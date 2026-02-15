// src/App.tsx
// Root orchestrator. Loads data once, manages fylke selection,
// filters features, and wires game state + timer to UI.

import { useState, useMemo } from "react";
import { useMapData } from "./hooks/useMapData";
import { useGameState } from "./hooks/useGameState";
import { useTimer, formatTime } from "./hooks/useTimer";
import { GameMap } from "./components/map/GameMap";
import { CommandBar } from "./components/ui/CommandBar";
import { CompletionOverlay } from "./components/ui/CompletionOverlay";
import "./styles/index.css";

export default function App() {
    const { features } = useMapData();
    const [selectedFylke, setSelectedFylke] = useState<string | null>(null);
    const [lensEnabled, setLensEnabled] = useState(false);
    const [fylkeHintEnabled, setFylkeHintEnabled] = useState(false);

    const fylker = useMemo(() => {
        const map = new Map<string, string>();
        for (const f of features) {
            map.set(f.properties.fylkesnummer, f.properties.fylkenavn);
        }
        return Array.from(map, ([fylkesnummer, fylkenavn]) => ({ fylkesnummer, fylkenavn }))
            .sort((a, b) => a.fylkenavn.localeCompare(b.fylkenavn, "no"));
    }, [features]);

    const activeFeatures = useMemo(() =>
            selectedFylke
                ? features.filter((f) => f.properties.fylkesnummer === selectedFylke)
                : features,
        [features, selectedFylke]
    );

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
            <CommandBar
                currentName={game.currentName}
                currentFylke={game.currentFylke}
                currentKommunenummer={game.currentKommunenummer}
                showFylke={fylkeHintEnabled}
                currentIndex={game.currentIndex}
                total={game.total}
                errors={game.errors}
                elapsed={formatTime(elapsed)}
                isComplete={game.isComplete}
                onSkip={game.handleSkip}
                onRestart={handleRestart}
                fylker={fylker}
                selectedFylke={selectedFylke}
                onFylkeChange={handleFylkeChange}
                lensEnabled={lensEnabled}
                onLensToggle={() => setLensEnabled((prev) => !prev)}
                fylkeHintEnabled={fylkeHintEnabled}
                onFylkeHintToggle={() => setFylkeHintEnabled((prev) => !prev)}
            />
            <div className="map-container">
                <GameMap
                    allFeatures={features}
                    activeFeatures={activeFeatures}
                    lensEnabled={lensEnabled}
                    solved={game.solved}
                    onGuess={game.handleGuess}
                />
                {game.isComplete && (
                    <CompletionOverlay
                        errors={game.errors}
                        elapsed={formatTime(elapsed)}
                        onRestart={handleRestart}
                    />
                )}
            </div>
        </div>
    );
}