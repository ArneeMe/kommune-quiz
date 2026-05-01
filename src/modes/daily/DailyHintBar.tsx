// src/modes/daily/DailyHintBar.tsx
// Progressive hint display for daily quiz mode.
// Map mode: guess history rows with distance + proximity %.
// Shield/Reverse: Hangman-style letter blanks.

import type { DailyHints } from "../../hooks/useDailyQuiz";
import type { GameMode } from "../../types";

interface DailyHintBarProps {
    hints: DailyHints;
    errorCount: number;
    mode: GameMode;
}

export function DailyHintBar({ hints, errorCount, mode }: DailyHintBarProps) {
    if (mode === "map") {
        if (hints.distanceHints.length === 0) return null;
        const minDist = Math.min(...hints.distanceHints.map((h) => h.distanceKm));
        return (
            <div className="daily-guess-history">
                {hints.distanceHints.map((dh, i) => {
                    const isClosest = hints.distanceHints.length > 1 && dh.distanceKm === minDist;
                    const proximityClass =
                        dh.proximity >= 70 ? "proximity-green"
                        : dh.proximity >= 30 ? "proximity-yellow"
                        : "proximity-red";
                    return (
                        <div key={i} className={`daily-guess-row${isClosest ? " daily-guess-closest" : ""}`}>
                            <span className="daily-guess-name">{dh.guessedName}</span>
                            <span className="daily-guess-arrow">{dh.arrow}</span>
                            <span className="daily-guess-km">{dh.distanceKm} km</span>
                            <span className={`daily-proximity-badge ${proximityClass}`}>{dh.proximity}%</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Shield / Reverse: show letter blanks (visible from error 0)
    if (!hints.letterBlanks) return null;
    const { display } = hints.letterBlanks;
    const revealedCount = hints.letterBlanks.slots.filter((s) => s !== null && s !== " " && s !== "-").length;
    return (
        <div className="daily-letter-blanks-wrap">
            <span className="daily-letter-blanks" aria-label="Bokstavhint">
                {display}
            </span>
            {errorCount > 0 && revealedCount > 0 && (
                <span className="daily-letter-blanks-sub">{revealedCount} bokstav{revealedCount !== 1 ? "er" : ""} avslørt</span>
            )}
        </div>
    );
}
