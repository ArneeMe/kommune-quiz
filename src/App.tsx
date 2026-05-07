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
import { useTheme } from "./hooks/useTheme";
import { DEFAULT_MODE } from "./config/gameModes";
import type { GameMode } from "./types";
import "./styles/index.css";

type AppView = "daily" | "freeplay";

// Empty array constant — inactive game hooks receive this so their
// shuffles and lookup memos are essentially free (O(0) instead of O(357)).
const EMPTY_FEATURES: never[] = [];

export default function App() {
    const { features } = useMapData();
    const { theme, toggleTheme } = useTheme();
    const [appView, setAppView] = useState<AppView>("daily");
    const [gameMode, setGameMode] = useState<GameMode>(DEFAULT_MODE);
    const [selectedFylke, setSelectedFylke] = useState<string | null>(null);
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

    // Only the active mode's hook receives real features — inactive hooks get
    // an empty array so their internal shuffles and lookups are trivially cheap.
    const mapGame = useMapGame(gameMode === "map" ? activeFeatures : EMPTY_FEATURES);
    const shieldGame = useShieldGame(gameMode === "shield" ? activeFeatures : EMPTY_FEATURES);
    const reverseGame = useReverseGame(gameMode === "reverse" ? activeFeatures : EMPTY_FEATURES);
    const daily = useDailyQuiz(features);

    const activeQuiz = gameMode === "map" ? mapGame : gameMode === "shield" ? shieldGame : reverseGame;

    const { elapsed, reset: resetTimer } = useTimer(
        appView === "freeplay" && !activeQuiz.isComplete
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
        // No explicit restart needed — mode change re-scopes features to the
        // new active hook, which re-initializes via its useEffect on features change.
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

    // --- Daily view (DEFAULT) ---
    if (appView === "daily") {
        return (
            <div className="app">
                <div className="map-container">
                    <DailyCommandBar
                        dayNumber={daily.dayNumber}
                        currentIndex={daily.currentIndex}
                        totalQuestions={daily.questions.length}
                        currentMode={daily.currentMode}
                        currentName={daily.currentName}
                        totalErrors={daily.totalErrors}
                        currentQuestionErrors={daily.perQuestionErrors[daily.currentIndex] ?? 0}
                        hints={daily.hints}
                        isComplete={daily.isComplete}
                        onGiveUp={daily.giveUp}
                        onFreePlay={() => setAppView("freeplay")}
                        theme={theme}
                        onThemeToggle={toggleTheme}
                    />
                    <DailyGame allFeatures={features} daily={daily} />
                    {daily.isComplete && (
                        <DailyCompletionOverlay
                            dayNumber={daily.dayNumber}
                            round={daily.round}
                            results={daily.results}
                            perQuestionErrors={daily.perQuestionErrors}
                            questions={daily.questions}
                            correctCount={daily.correctCount}
                            history={daily.history}
                            onBackToMenu={() => setAppView("freeplay")}
                            onRetry={daily.retryDaily}
                            onPlayOneMore={daily.playOneMore}
                        />
                    )}
                </div>
            </div>
        );
    }

    // --- Free play view ---
    return (
        <div className="app">
            <div className="map-container">
                <CommandBar
                    gameMode={gameMode}
                    onModeChange={handleModeChange}
                    game={{
                        currentName: gameMode === "map" ? activeQuiz.currentName : "",
                        currentFylke: activeQuiz.currentFylke,
                        currentKommunenummer: gameMode === "map" ? activeQuiz.currentKommunenummer : "",
                        showFylke: fylkeHintEnabled && gameMode === "map" && selectedFylke === null,
                        showTarget: gameMode === "map",
                        solvedCount: activeQuiz.solved.size,
                        total: activeQuiz.total,
                        errors: activeQuiz.errors,
                        elapsed: formatTime(elapsed),
                        isComplete: activeQuiz.isComplete,
                        revealAnswer,
                        distanceHints: gameMode === "map" ? mapGame.distanceHints : undefined,
                        onSkip: activeQuiz.handleSkip,
                        onGiveUp: handleGiveUp,
                        onRestart: handleRestart,
                    }}
                    filter={{
                        fylker,
                        selectedFylke,
                        onFylkeChange: handleFylkeChange,
                        hintEnabled: fylkeHintEnabled,
                        onHintToggle: () => setFylkeHintEnabled((prev) => !prev),
                        showHintToggle: gameMode === "map" && selectedFylke === null,
                    }}
                    onDailyClick={() => setAppView("daily")}
                    dailyCompleted={daily.isComplete}
                    theme={theme}
                    onThemeToggle={toggleTheme}
                />
                {gameMode === "map" && (
                    <MapGame
                        allFeatures={features}
                        activeFeatures={activeFeatures}
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
