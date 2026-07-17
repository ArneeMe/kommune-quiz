// src/components/ui/CompletionOverlay.tsx
// Celebratory overlay shown when all kommuner are found.
// Floats over the map with results and replay button.

import { Confetti } from "./Confetti";
import { formatTime } from "../../hooks/useTimer";
import type { BestTime } from "../../utils/bestTimes";

interface CompletionOverlayProps {
    errors: number;
    elapsed: string;
    best: BestTime | null;
    isNewRecord: boolean;
    onRestart: () => void;
}

export function CompletionOverlay({ errors, elapsed, best, isNewRecord, onRestart }: CompletionOverlayProps) {
    return (
        <div className="completion-overlay">
            <Confetti />
            <div className="completion-card">
                <div className="completion-icon">{isNewRecord ? "🏅" : "✦"}</div>
                <h2 className="completion-title">Ferdig!</h2>
                {isNewRecord && <div className="completion-record">Ny rekord!</div>}
                <div className="completion-stats">
                    <div className="completion-stat">
                        <span className="completion-stat-value">{elapsed}</span>
                        <span className="completion-stat-label">tid</span>
                    </div>
                    <div className="completion-stat-divider" />
                    <div className="completion-stat">
                        <span className="completion-stat-value">{errors}</span>
                        <span className="completion-stat-label">feil</span>
                    </div>
                </div>
                {!isNewRecord && best && (
                    <p className="completion-best-line">
                        🏅 Rekord: {formatTime(best.timeSeconds)} · {best.errors} feil
                    </p>
                )}
                <button className="completion-btn" onClick={onRestart}>
                    Spill igjen
                </button>
            </div>
        </div>
    );
}
