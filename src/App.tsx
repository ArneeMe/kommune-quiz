// src/App.tsx
import { useState, useMemo } from "react";
import { useMapData } from "./hooks/useMapData";
import { useTimer, formatTime } from "./hooks/useTimer";
import { useMapGame } from "./modes/map/useMapGame";
import { useShieldGame } from "./modes/shield/useShieldGame";
import { useReverseGame } from "./modes/reverse/useReverseGame";
import { useDailyQuiz } from "./hooks/useDailyQuiz";
import { MapGame } from "./modes/map/MapGame";
import { ShieldGame } from "./modes/shield/ShieldGame";
import { ReverseGame } from "./modes/reverse/ReverseGame";
import { DailyGame } from "./modes/daily/DailyGame";
import { DailyCommandBar } from "./modes/daily/DailyCommandBar";
import { DailyCompletionOverlay } from "./modes/daily/DailyCompletionOverlay";
import { CommandBar } from "./components/ui/CommandBar";
import { CompletionOverlay } from "./components/ui/CompletionOverlay";
import { DEFAULT_MODE } from "./config/gameModes";
import type { GameMode, QuizState } from "./types";
import "./styles/index.css";

type AppView = "standard" | "daily";

export default function App() {
    const { features } = useMapData();
    const [appView, setAppView] = useState<AppView>("standard");
    const [gameMode, setGameMode] = useState<GameMode>(DEFAULT_MODE);
    const [selectedFylke, setSelectedFylke] = useState<string | null>(null);
    const [lensEnabled, setLensEnabled] = useState(false);
    const [fylkeHintEnabled, setFylkeHintEnabled] = useState(false);
    const [revealAnswer, setRevealAnswer] = useState<string | null>(null);

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

    const mapGame = useMapGame(activeFeatures);
    const shieldGame = useShieldGame(activeFeatures);
    const reverseGame = useReverseGame(activeFeatures);
    const daily = useDailyQuiz(features);

    const activeQuiz: QuizState =
        gameMode === "map" ? mapGame :
            gameMode === "shield" ? shieldGame :
                reverseGame;

    const { elapsed, reset: resetTimer } = useTimer(
        appView === "standard" && !activeQuiz.isComplete
    );

    const handleRestart = () => {
        activeQuiz.handleRestart();
        resetTimer();
        setRevealAnswer(null);
    };

    const handleFylkeChange = (fylkesnummer: string | null) => {
        setSelectedFylke(fylkesnummer);
        resetTimer();
        setRevealAnswer(null);
    };

    const handleModeChange = (mode: GameMode) => {
        setGameMode(mode);
        mapGame.handleRestart();
        shieldGame.handleRestart();
        reverseGame.handleRestart();
        resetTimer();
        setRevealAnswer(null);
    };

    const handleGiveUp = () => {
        const answer = activeQuiz.currentName;
        setRevealAnswer(answer);
        setTimeout(() => {
            activeQuiz.handleGiveUp();
            setRevealAnswer(null);
        }, 1500);
    };

    const showName = gameMode === "map";
    const showShieldInHeader = gameMode === "map";

    // --- Daily view ---
    if (appView === "daily") {
        return (
            <div className="app">
                <DailyCommandBar
                    dayNumber={daily.dayNumber}
                    currentIndex={daily.currentIndex}
                    totalQuestions={daily.questions.length}
                    currentMode={daily.currentMode}
                    currentName={daily.currentName}
                    totalErrors={daily.totalErrors}
                    isComplete={daily.isComplete}
                    onGiveUp={daily.giveUp}
                    onBack={() => setAppView("standard")}
                />
                <div className="map-container">
                    <DailyGame
                        allFeatures={features}
                        daily={daily}
                    />
                    {daily.isComplete && (
                        <DailyCompletionOverlay
                            dayNumber={daily.dayNumber}
                            results={daily.results}
                            perQuestionErrors={daily.perQuestionErrors}
                            correctCount={daily.correctCount}
                            onBackToMenu={() => setAppView("standard")}
                        />
                    )}
                </div>
            </div>
        );
    }

    // --- Standard view ---
    return (
        <div className="app">
            <CommandBar
                gameMode={gameMode}
                onModeChange={handleModeChange}
                currentName={showName ? activeQuiz.currentName : ""}
                currentFylke={activeQuiz.currentFylke}
                currentKommunenummer={showShieldInHeader ? activeQuiz.currentKommunenummer : ""}
                showFylke={fylkeHintEnabled && gameMode === "map" && selectedFylke === null}
                showTarget={showName}
                solvedCount={activeQuiz.solved.size}
                total={activeQuiz.total}
                errors={activeQuiz.errors}
                elapsed={formatTime(elapsed)}
                isComplete={activeQuiz.isComplete}
                onSkip={activeQuiz.handleSkip}
                onGiveUp={handleGiveUp}
                onRestart={handleRestart}
                revealAnswer={revealAnswer}
                fylker={fylker}
                selectedFylke={selectedFylke}
                onFylkeChange={handleFylkeChange}
                lensEnabled={lensEnabled}
                onLensToggle={() => setLensEnabled((prev) => !prev)}
                fylkeHintEnabled={fylkeHintEnabled}
                onFylkeHintToggle={() => setFylkeHintEnabled((prev) => !prev)}
                showLensToggle={gameMode === "map"}
                showFylkeHintToggle={gameMode === "map" && selectedFylke === null}
                onDailyClick={() => setAppView("daily")}
                dailyCompleted={daily.isComplete}
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
