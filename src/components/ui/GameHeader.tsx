// src/components/ui/GameHeader.tsx
// Displays the current target kommune, progress counter, error count, and skip button.

interface GameHeaderProps {
    currentName: string;
    currentIndex: number;
    total: number;
    errors: number;
    isComplete: boolean;
    onSkip: () => void;
}

export function GameHeader({
                               currentName,
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
                    <div className="game-target">Finn: <strong>{currentName}</strong></div>
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