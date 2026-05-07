// src/components/ui/CommandBar.tsx
import { KommuneShield } from "./KommuneShield";
import { ModeSelector } from "./ModeSelector";
import { ThemeToggle } from "./ThemeToggle";
import type { GameMode } from "../../types";
import type { DistanceHint } from "../../modes/map/useMapGame";
import type { Theme } from "../../hooks/useTheme";

export interface GameInfo {
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
    revealAnswer: string | null;
    distanceHints?: DistanceHint[];
    onSkip: () => void;
    onGiveUp: () => void;
    onRestart: () => void;
}

export interface FylkeFilter {
    fylker: { fylkesnummer: string; fylkenavn: string }[];
    selectedFylke: string | null;
    onFylkeChange: (fylkesnummer: string | null) => void;
    hintEnabled: boolean;
    onHintToggle: () => void;
    showHintToggle: boolean;
}

interface CommandBarProps {
    gameMode: GameMode;
    onModeChange: (mode: GameMode) => void;
    game: GameInfo;
    filter: FylkeFilter;
    onDailyClick?: () => void;
    dailyCompleted?: boolean;
    theme: Theme;
    onThemeToggle: () => void;
}

export function CommandBar({
    gameMode,
    onModeChange,
    game,
    filter,
    onDailyClick,
    dailyCompleted,
    theme,
    onThemeToggle,
}: CommandBarProps) {
    const progress = game.total > 0 ? Math.min(100, Math.max(0, (game.solvedCount / game.total) * 100)) : 0;

    return (
        <div className="command-bar">
            <div className="cb-left">
                <ModeSelector selected={gameMode} onChange={onModeChange} />
                <select
                    className="cb-select"
                    value={filter.selectedFylke ?? ""}
                    onChange={(e) => filter.onFylkeChange(e.target.value || null)}
                >
                    <option value="">Hele Norge</option>
                    {filter.fylker.map(({ fylkesnummer, fylkenavn }) => (
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
                        <span className="daily-entry-icon">{dailyCompleted ? "✓" : "📅"}</span>
                        <span>Dagens</span>
                    </button>
                )}
            </div>

            <div className="cb-center">
                {game.revealAnswer && (
                    <div className="cb-reveal">
                        Svaret var: <strong>{game.revealAnswer}</strong>
                    </div>
                )}
                {!game.revealAnswer && !game.isComplete && (
                    <>
                        {game.showTarget && (
                            <div className="cb-target">
                                <span className="cb-label">Finn</span>
                                {game.currentKommunenummer && (
                                    <KommuneShield kommunenummer={game.currentKommunenummer} />
                                )}
                                <strong className="cb-name">{game.currentName}</strong>
                                {game.showFylke && <span className="cb-fylke">{game.currentFylke}</span>}
                                {game.distanceHints && game.distanceHints.slice(-3).map((dh, i) => (
                                    <span key={i} className="cb-distance-hint">
                                        <span className="cb-distance-arrow">{dh.arrow}</span>
                                        <span className="cb-distance-km">{dh.distanceKm} km</span>
                                    </span>
                                ))}
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
                        <span className="cb-stat-value">{game.solvedCount}</span>
                        <span className="cb-stat-label">/{game.total}</span>
                    </span>
                    <span className="cb-stat cb-stat-errors">
                        <span className="cb-stat-value">{game.errors}</span>
                        <span className="cb-stat-label">feil</span>
                    </span>
                    <span className="cb-timer">{game.elapsed}</span>
                </div>
                <div className="cb-actions">
                    {filter.showHintToggle && (
                        <button
                            className={`cb-tool ${filter.hintEnabled ? "cb-tool-active" : ""}`}
                            onClick={filter.onHintToggle}
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
                    {!game.isComplete && (
                        <>
                            <button className="cb-btn cb-btn-ghost" onClick={game.onSkip}>
                                Hopp over
                            </button>
                            <button className="cb-btn cb-btn-ghost cb-btn-giveup" onClick={game.onGiveUp}>
                                Gi opp
                            </button>
                        </>
                    )}
                    <button className="cb-btn cb-btn-ghost" onClick={game.onRestart}>
                        ↺
                    </button>
                    <ThemeToggle theme={theme} onToggle={onThemeToggle} />
                </div>
            </div>
        </div>
    );
}
