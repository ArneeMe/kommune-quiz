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
                    <span className="daily-hint-icon">{"\uD83D\uDCCD"}</span>
                    <span className="daily-hint-text">{hints.fylke}</span>
                </div>
            )}
            {hints.distanceHints.map((dh, i) => (
                <div key={i} className="daily-hint daily-hint-distance">
                    <span className="daily-hint-icon">{dh.arrow}</span>
                    <span className="daily-hint-text">{dh.distanceKm} km</span>
                </div>
            ))}
            {hints.letterReveal && (
                <div className="daily-hint daily-hint-letters">
                    <span className="daily-hint-icon">{"\uD83D\uDCA1"}</span>
                    <span className="daily-hint-text">Starter med <strong>{hints.letterReveal}</strong></span>
                </div>
            )}
        </div>
    );
}
