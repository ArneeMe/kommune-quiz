// src/modes/daily/DailyCommandBar.tsx
// Simplified command bar for daily quiz mode.

import { GAME_MODES } from "../../config/gameModes";
import { DailyHintBar } from "./DailyHintBar";
import type { GameMode } from "../../types";
import type { DailyHints } from "../../hooks/useDailyQuiz";

interface DailyCommandBarProps {
    dayNumber: number;
    currentIndex: number;
    totalQuestions: number;
    currentMode: GameMode;
    currentName: string;
    totalErrors: number;
    currentQuestionErrors: number;
    hints: DailyHints;
    isComplete: boolean;
    onGiveUp: () => void;
    onBack: () => void;
}

export function DailyCommandBar({
    dayNumber,
    currentIndex,
    totalQuestions,
    currentMode,
    currentName,
    totalErrors,
    currentQuestionErrors,
    hints,
    isComplete,
    onGiveUp,
    onBack,
}: DailyCommandBarProps) {
    const modeInfo = GAME_MODES.find((m) => m.mode === currentMode);
    const progress = totalQuestions > 0
        ? (Math.min(currentIndex, totalQuestions) / totalQuestions) * 100
        : 0;

    return (
        <div className="command-bar">
            <div className="cb-left">
                <button className="cb-btn cb-btn-ghost" onClick={onBack}>
                    {"\u2190"} Tilbake
                </button>
                <span className="daily-day-badge">#{dayNumber}</span>
            </div>

            <div className="cb-center">
                {!isComplete && (
                    <>
                        <div className="cb-target">
                            <span className="daily-question-number">
                                {currentIndex + 1}/{totalQuestions}
                            </span>
                            {modeInfo && (
                                <span className="daily-mode-badge">
                                    <span className="mode-btn-icon">{modeInfo.icon}</span>
                                    <span className="mode-btn-label">{modeInfo.label}</span>
                                </span>
                            )}
                            {currentMode === "map" && currentName && (
                                <strong className="cb-name">{currentName}</strong>
                            )}
                        </div>
                        <div className="cb-progress-track">
                            <div className="cb-progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                    </>
                )}
            </div>

            <div className="cb-controls">
                <div className="cb-stats">
                    <span className="cb-stat cb-stat-errors">
                        <span className="cb-stat-value">{totalErrors}</span>
                        <span className="cb-stat-label">feil</span>
                    </span>
                </div>
                <div className="cb-actions">
                    {!isComplete && (
                        <button className="cb-btn cb-btn-ghost cb-btn-giveup" onClick={onGiveUp}>
                            Gi opp
                        </button>
                    )}
                </div>
            </div>
            {!isComplete && currentQuestionErrors > 0 && currentMode === "map" && (
                <div className="daily-hint-row">
                    <DailyHintBar hints={hints} errorCount={currentQuestionErrors} />
                </div>
            )}
        </div>
    );
}
