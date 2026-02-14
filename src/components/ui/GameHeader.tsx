// src/components/ui/GameHeader.tsx
// Displays the current target kommune (with shield), optional fylke hint,
// progress, errors, timer, skip, and restart.

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
    return (
        <div className="game-header">
            {isComplete ? (
                <div className="game-complete">
                    <div>Ferdig! {errors} feil — {elapsed}</div>
                    <button className="restart-button" onClick={onRestart}>Spill igjen</button>
                </div>
            ) : (
                <>
                    <div className="game-target">
                        Finn:{" "}
                        <KommuneShield kommunenummer={currentKommunenummer} />
                        <strong>{currentName}</strong>
                        {showFylke && <span className="fylke-hint"> ({currentFylke})</span>}
                    </div>
                    <div className="game-stats">
                        <span>{currentIndex} av {total}</span>
                        <span className="game-errors">{errors} feil</span>
                        <span className="game-timer">{elapsed}</span>
                        <button className="skip-button" onClick={onSkip}>Hopp over →</button>
                        <button className="skip-button" onClick={onRestart}>↺ Start på nytt</button>
                    </div>
                </>
            )}
        </div>
    );
}