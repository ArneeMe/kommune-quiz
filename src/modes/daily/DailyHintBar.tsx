// src/modes/daily/DailyHintBar.tsx
// Progressive hint display for daily quiz mode.
// Shows unlocked hints based on number of wrong guesses.

import type { DailyHints } from "../../hooks/useDailyQuiz";

interface DailyHintBarProps {
    hints: DailyHints;
    errorCount: number;
}

export function DailyHintBar({ hints, errorCount }: DailyHintBarProps) {
    if (errorCount === 0) return null;

    return (
        <div className="daily-hints">
            {hints.fylke && (
                <div className="daily-hint daily-hint-fylke">
                    <span className="daily-hint-icon">📍</span>
                    <span className="daily-hint-text">{hints.fylke}</span>
                </div>
            )}
            {hints.distanceKm !== null && hints.directionArrow && (
                <div className="daily-hint daily-hint-distance">
                    <span className="daily-hint-icon">{hints.directionArrow}</span>
                    <span className="daily-hint-text">{hints.distanceKm} km unna</span>
                </div>
            )}
            {hints.firstLetters && (
                <div className="daily-hint daily-hint-letters">
                    <span className="daily-hint-icon">💡</span>
                    <span className="daily-hint-text">Starter med <strong>{hints.firstLetters}</strong></span>
                </div>
            )}
        </div>
    );
}
