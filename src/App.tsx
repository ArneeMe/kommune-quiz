// src/App.tsx
// Root orchestrator. Manages mode, fylke selection, and renders
// the active game mode component.

import { useState, useMemo } from "react";
import { useMapData } from "./hooks/useMapData";
import { useTimer, formatTime } from "./hooks/useTimer";
import { useMapGame } from "./modes/map/useMapGame";
import { useShieldGame } from "./modes/shield/useShieldGame";
import { useReverseGame } from "./modes/reverse/useReverseGame";
import { MapGame } from "./modes/map/MapGame";
import { ShieldGame } from "./modes/shield/ShieldGame";
import { ReverseGame } from "./modes/reverse/ReverseGame";
import { CommandBar } from "./components/ui/CommandBar";
import { CompletionOverlay } from "./components/ui/CompletionOverlay";
import { DEFAULT_MODE } from "./config/gameModes";
import type { GameMode, QuizState } from "./types";
import "./styles/index.css";

export default function App() {
    const { features } = useMapData();
    const [gameMode, setGameMode] = useState<GameMode>(DEFAULT_MODE);
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

    // All three hooks run — only the active one's UI renders.
    // This keeps state alive if the user switches back to a mode.
    const mapGame = useMapGame(activeFeatures);
    const shieldGame = useShieldGame(activeFeatures);
    const reverseGame = useReverseGame(activeFeatures);

    // Pick the active quiz state for shared UI (CommandBar, timer, completion)
    const activeQuiz: QuizState =
        gameMode === "map" ? mapGame :
            gameMode === "shield" ? shieldGame :
                reverseGame;

    const { elapsed, reset: resetTimer } = useTimer(!activeQuiz.isComplete);

    const handleRestart = () => {
        activeQuiz.handleRestart();
        resetTimer();
    };

    const handleFylkeChange = (fylkesnummer: string | null) => {
        setSelectedFylke(fylkesnummer);
        resetTimer();
    };

    const handleModeChange = (mode: GameMode) => {
        setGameMode(mode);
        // Reset all modes so they start fresh
        mapGame.handleRestart();
        shieldGame.handleRestart();
        reverseGame.handleRestart();
        resetTimer();
    };

    // Determine what the CommandBar should show based on mode
    const showName = gameMode === "map";
    const showShieldInHeader = gameMode === "map";

    return (
        <div className="app">
            <CommandBar
                gameMode={gameMode}
                onModeChange={handleModeChange}
                currentName={showName ? activeQuiz.currentName : ""}
                currentFylke={activeQuiz.currentFylke}
                currentKommunenummer={showShieldInHeader ? activeQuiz.currentKommunenummer : ""}
                showFylke={fylkeHintEnabled && gameMode !== "reverse"}
                showTarget={showName}
                currentIndex={activeQuiz.currentIndex}
                total={activeQuiz.total}
                errors={activeQuiz.errors}
                elapsed={formatTime(elapsed)}
                isComplete={activeQuiz.isComplete}
                onSkip={activeQuiz.handleSkip}
                onRestart={handleRestart}
                fylker={fylker}
                selectedFylke={selectedFylke}
                onFylkeChange={handleFylkeChange}
                lensEnabled={lensEnabled}
                onLensToggle={() => setLensEnabled((prev) => !prev)}
                fylkeHintEnabled={fylkeHintEnabled}
                onFylkeHintToggle={() => setFylkeHintEnabled((prev) => !prev)}
                showLensToggle={gameMode === "map"}
                showFylkeHintToggle={gameMode !== "reverse"}
            />
            <div className="map-container">
                {gameMode === "map" && (
                    <MapGame
                        allFeatures={features}
                        activeFeatures={activeFeatures}
                        lensEnabled={lensEnabled}
                        game={mapGame}
                    />
                )}
                {gameMode === "shield" && (
                    <ShieldGame game={shieldGame} />
                )}
                {gameMode === "reverse" && (
                    <ReverseGame
                        allFeatures={features}
                        activeFeatures={activeFeatures}
                        game={reverseGame}
                    />
                )}
                {activeQuiz.isComplete && (
                    <CompletionOverlay
                        errors={activeQuiz.errors}
                        elapsed={formatTime(elapsed)}
                        onRestart={handleRestart}
                    />
                )}
            </div>
        </div>
    );
}