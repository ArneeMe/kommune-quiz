// src/components/ui/HintBar.tsx
// Progressive hint display — used by both daily and free-play modes.
// Map / Reverse: wrong-guess history with shield + distance + proximity %.
// Shield: hangman-style letter blanks + area hint.
// Reverse (input area): a separate prefix-of-name hint (rendered above the history).

import { KommuneShield } from "./KommuneShield";
import type { DailyHints, DailyDistanceHint } from "../../hooks/useDailyQuiz";
import type { GameMode } from "../../types";

interface HintBarProps {
    hints: DailyHints;
    errorCount: number;
    mode: GameMode;
}

export function HintBar({ hints, errorCount, mode }: HintBarProps) {
    if (mode === "map" || mode === "reverse") {
        return <GuessHistory hints={hints.distanceHints} />;
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

// Reverse-mode prefix hint — shown above the wrong-guess history so the player
// always knows how the name starts without ever being told its length.
export function PrefixHint({ slots }: { slots: (string | null)[] }) {
    const prefix = getRevealedPrefix(slots);
    if (!prefix) return null;
    return (
        <div className="daily-prefix-hint" aria-label="Bokstavhint">
            <span className="daily-prefix-label">Starter med</span>
            <span className="daily-prefix-text">{prefix}…</span>
        </div>
    );
}

// Shared wrong-guess history: one row per wrong guess with the kommune's shield,
// name, direction arrow, distance, and proximity %. Visually marked as a wrong
// guess so the player learns the shield ↔ name pairing even though they missed.
export function GuessHistory({ hints }: { hints: DailyDistanceHint[] }) {
    if (hints.length === 0) return null;
    const minDist = Math.min(...hints.map((h) => h.distanceKm));
    return (
        <div className="daily-guess-history" aria-label="Feilgjettinger">
            {hints.map((dh, i) => {
                const isClosest = hints.length > 1 && dh.distanceKm === minDist;
                const proximityClass =
                    dh.proximity >= 70 ? "proximity-green"
                    : dh.proximity >= 30 ? "proximity-yellow"
                    : "proximity-red";
                return (
                    <div key={i} className={`daily-guess-row daily-guess-wrong${isClosest ? " daily-guess-closest" : ""}`}>
                        <span className="daily-guess-shield-wrap" aria-label={`Feil: ${dh.guessedName}`}>
                            <KommuneShield kommunenummer={dh.kommunenummer} size={32} />
                            <span className="daily-guess-wrong-badge" aria-hidden="true">✕</span>
                        </span>
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

// Pull out the leading run of revealed letters (stops at the first blank).
function getRevealedPrefix(slots: (string | null)[]): string {
    let out = "";
    for (const s of slots) {
        if (s === null) break;
        out += s;
    }
    return out.trim();
}
