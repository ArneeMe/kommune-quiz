// src/modes/daily/DailyHintBar.tsx
// Progressive hint display for daily quiz mode.
// Map mode: guess history rows with distance + proximity %.
// Shield/Reverse: Hangman-style letter blanks with pop animations.

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

    // Shield / Reverse: render individual letter slots with animations
    if (!hints.letterBlanks) return null;
    const { slots } = hints.letterBlanks;
    const revealedCount = slots.filter((s) => s !== null && s !== " " && s !== "-").length;

    return (
        <div className="daily-letter-blanks-wrap">
            <div className="daily-letter-slots" aria-label="Bokstavhint">
                {slots.map((slot, i) => {
                    if (slot === " ") return <span key={i} className="daily-slot-space" />;
                    if (slot === "-") return <span key={i} className="daily-slot-sep">-</span>;
                    if (slot !== null) {
                        return (
                            <span key={i} className="daily-slot daily-slot-revealed">
                                {slot}
                            </span>
                        );
                    }
                    return (
                        <span key={i} className="daily-slot daily-slot-blank">
                            _
                        </span>
                    );
                })}
            </div>
            {errorCount > 0 && revealedCount > 0 && (
                <span className="daily-letter-blanks-sub">{revealedCount} bokstav{revealedCount !== 1 ? "er" : ""} avslørt</span>
            )}
        </div>
    );
}
