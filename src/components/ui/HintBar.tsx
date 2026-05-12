// src/components/ui/HintBar.tsx
// Progressive hint display — used by both daily and free-play modes.
// Map mode: guess history rows with distance + proximity %.
// Shield/Reverse: Hangman-style letter blanks with pop animations.

import type { DailyHints } from "../../hooks/useDailyQuiz";
import type { GameMode } from "../../types";

interface HintBarProps {
    hints: DailyHints;
    errorCount: number;
    mode: GameMode;
}

export function HintBar({ hints, errorCount, mode }: HintBarProps) {
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

    // Reverse: progressive prefix reveal — never expose total length, just show
    // how the name starts.
    if (mode === "reverse") {
        if (!hints.letterBlanks) return null;
        const prefix = getRevealedPrefix(hints.letterBlanks.slots);
        if (!prefix) return null;
        return (
            <div className="daily-prefix-hint" aria-label="Bokstavhint">
                <span className="daily-prefix-label">Starter med</span>
                <span className="daily-prefix-text">{prefix}…</span>
            </div>
        );
    }

    // Shield: hangman blanks + optional area hint
    if (!hints.letterBlanks && hints.areaHint == null) return null;
    const slots = hints.letterBlanks?.slots ?? [];
    const revealedCount = slots.filter((s) => s !== null && s !== " " && s !== "-").length;

    return (
        <div className="daily-letter-blanks-wrap">
            {hints.areaHint != null && (
                <div className="daily-area-hint" aria-label="Areal">
                    <span className="daily-area-label">Areal</span>
                    <span className="daily-area-value">{hints.areaHint.toLocaleString("nb-NO")} km²</span>
                </div>
            )}
            {slots.length > 0 && (
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
            )}
            {errorCount > 0 && revealedCount > 0 && (
                <span className="daily-letter-blanks-sub">{revealedCount} bokstav{revealedCount !== 1 ? "er" : ""} avslørt</span>
            )}
        </div>
    );
}

// Pull out the leading run of revealed letters (stops at the first blank).
function getRevealedPrefix(slots: (string | null)[]): string {
    let out = "";
    for (const s of slots) {
        if (s === null) break;
        out += s;
    }
    return out.trim();
}
