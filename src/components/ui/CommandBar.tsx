// src/components/ui/CommandBar.tsx
import { KommuneShield } from "./KommuneShield";
import { ModeSelector } from "./ModeSelector";
import { ThemeToggle } from "./ThemeToggle";
import type { GameMode } from "../../types";
import type { Theme } from "../../hooks/useTheme";

interface CommandBarProps {
    gameMode: GameMode;
    onModeChange: (mode: GameMode) => void;
    currentName: string;
    currentFylke: string;
    currentKommunenummer: string;
    showFylke: boolean;
    showTarget: boolean;
    solvedCount: number;
    total: number;
    errors: number;
    elapsed: string;
    isComplete: boolean;
    onSkip: () => void;
    onGiveUp: () => void;
    onRestart: () => void;
    revealAnswer: string | null;
    fylker: { fylkesnummer: string; fylkenavn: string }[];
    selectedFylke: string | null;
    onFylkeChange: (fylkesnummer: string | null) => void;
    fylkeHintEnabled: boolean;
    onFylkeHintToggle: () => void;
    showFylkeHintToggle: boolean;
    onDailyClick?: () => void;
    dailyCompleted?: boolean;
    theme: Theme;
    onThemeToggle: () => void;
}

export function CommandBar({
    gameMode,
    onModeChange,
    currentName,
    currentFylke,
    currentKommunenummer,
    showFylke,
    showTarget,
    solvedCount,
    total,
    errors,
    elapsed,
    isComplete,
    onSkip,
    onGiveUp,
    onRestart,
    revealAnswer,
    fylker,
    selectedFylke,
    onFylkeChange,
    fylkeHintEnabled,
    onFylkeHintToggle,
    showFylkeHintToggle,
    onDailyClick,
    dailyCompleted,
    theme,
    onThemeToggle,
}: CommandBarProps) {
    const progress = total > 0 ? (solvedCount / total) * 100 : 0;

    return (
        <div className="command-bar">
            <div className="cb-left">
                <ModeSelector selected={gameMode} onChange={onModeChange} />
                <select
                    className="cb-select"
                    value={selectedFylke ?? ""}
                    onChange={(e) => onFylkeChange(e.target.value || null)}
                >
                    <option value="">Hele Norge</option>
                    {fylker.map(({ fylkesnummer, fylkenavn }) => (
                        <option key={fylkesnummer} value={fylkesnummer}>
                            {fylkenavn}
                        </option>
                    ))}
                </select>
                {onDailyClick && (
                    <button
                        className={`daily-entry-btn ${dailyCompleted ? "daily-entry-btn-done" : ""}`}
                        onClick={onDailyClick}
                        title="Dagens quiz"
                    >
                        <span className="daily-entry-icon">{dailyCompleted ? "\u2713" : "\uD83D\uDCC5"}</span>
                        <span>Dagens</span>
                    </button>
                )}
            </div>

            <div className="cb-center">
                {revealAnswer && (
                    <div className="cb-reveal">
                        Svaret var: <strong>{revealAnswer}</strong>
                    </div>
                )}
                {!revealAnswer && !isComplete && (
                    <>
                        {showTarget && (
                            <div className="cb-target">
                                <span className="cb-label">Finn</span>
                                {currentKommunenummer && (
                                    <KommuneShield kommunenummer={currentKommunenummer} />
                                )}
                                <strong className="cb-name">{currentName}</strong>
                                {showFylke && <span className="cb-fylke">{currentFylke}</span>}
                            </div>
                        )}
                        <div className="cb-progress-track">
                            <div className="cb-progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                    </>
                )}
            </div>

            <div className="cb-controls">
                <div className="cb-stats">
                    <span className="cb-stat">
                        <span className="cb-stat-value">{solvedCount}</span>
                        <span className="cb-stat-label">/{total}</span>
                    </span>
                    <span className="cb-stat cb-stat-errors">
                        <span className="cb-stat-value">{errors}</span>
                        <span className="cb-stat-label">feil</span>
                    </span>
                    <span className="cb-timer">{elapsed}</span>
                </div>
                <div className="cb-actions">
                    {showFylkeHintToggle && (
                        <button
                            className={`cb-tool ${fylkeHintEnabled ? "cb-tool-active" : ""}`}
                            onClick={onFylkeHintToggle}
                            title="Vis fylke"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" />
                                <path d="M9 4v13" />
                                <path d="M15 7v13" />
                            </svg>
                        </button>
                    )}
                    <div className="cb-divider" />
                    {!isComplete && (
                        <>
                            <button className="cb-btn cb-btn-ghost" onClick={onSkip}>
                                Hopp over
                            </button>
                            <button className="cb-btn cb-btn-ghost cb-btn-giveup" onClick={onGiveUp}>
                                Gi opp
                            </button>
                        </>
                    )}
                    <button className="cb-btn cb-btn-ghost" onClick={onRestart}>
                        ↺
                    </button>
                    <ThemeToggle theme={theme} onToggle={onThemeToggle} />
                </div>
            </div>
        </div>
    );
}
