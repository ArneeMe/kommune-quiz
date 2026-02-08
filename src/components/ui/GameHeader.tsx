// src/components/ui/GameHeader.tsx
// Displays the current target kommune, optional fylke hint, progress counter, error count, and skip button.

interface GameHeaderProps {
    currentName: string;
    currentFylke: string;
    showFylke: boolean;
    currentIndex: number;
    total: number;
    errors: number;
    isComplete: boolean;
    onSkip: () => void;
}

export function GameHeader({
                               currentName,
                               currentFylke,
                               showFylke,
                               currentIndex,
                               total,
                               errors,
                               isComplete,
                               onSkip,
                           }: GameHeaderProps) {
    return (
        <div className="game-header">
            {isComplete ? (
                <div className="game-complete">
                    Ferdig! {errors} feil
                </div>
            ) : (
                <>
                    <div className="game-target">
                        Finn: <strong>{currentName}</strong>
                        {showFylke && <span className="fylke-hint"> ({currentFylke})</span>}
                    </div>
                    <div className="game-stats">
                        <span>{currentIndex} av {total}</span>
                        <span className="game-errors">{errors} feil</span>
                        <button className="skip-button" onClick={onSkip}>Hopp over →</button>
                    </div>
                </>
            )}
        </div>
    );
}