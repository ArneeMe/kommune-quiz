// src/components/ui/GameHeader.tsx
// Target kommune, progress bar, stats, and actions.

import { KommuneShield } from "./KommuneShield";

interface GameHeaderProps {
    currentName: string;
    currentFylke: string;
    currentKommunenummer: string;
    showFylke: boolean;
    currentIndex: number;
    total: number;
    errors: number;
    elapsed: string;
    isComplete: boolean;
    onSkip: () => void;
    onRestart: () => void;
}

export function GameHeader({
                               currentName,
                               currentFylke,
                               currentKommunenummer,
                               showFylke,
                               currentIndex,
                               total,
                               errors,
                               elapsed,
                               isComplete,
                               onSkip,
                               onRestart,
                           }: GameHeaderProps) {
    if (isComplete) {
        return (
            <div className="game-header">
                <div className="game-complete">
                    <div>Ferdig! {errors} feil — {elapsed}</div>
                    <button className="restart-button" onClick={onRestart}>
                        Spill igjen
                    </button>
                </div>
            </div>
        );
    }

    const progress = total > 0 ? (currentIndex / total) * 100 : 0;

    return (
        <div className="game-header">
            <div className="game-target">
                Finn:{" "}
                <KommuneShield kommunenummer={currentKommunenummer} />
                <strong>{currentName}</strong>
                {showFylke && <span className="fylke-hint"> ({currentFylke})</span>}
            </div>
            <div className="progress-bar-container">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="game-stats">
                <span>{currentIndex} av {total}</span>
                <span className="game-errors">{errors} feil</span>
                <span className="game-timer">{elapsed}</span>
                <button className="skip-button" onClick={onSkip}>Hopp over →</button>
                <button className="skip-button" onClick={onRestart}>↺ Start på nytt</button>
            </div>
        </div>
    );
}