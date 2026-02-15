// src/components/ui/CompletionOverlay.tsx
// Celebratory overlay shown when all kommuner are found.
// Floats over the map with results and replay button.

interface CompletionOverlayProps {
    errors: number;
    elapsed: string;
    onRestart: () => void;
}

export function CompletionOverlay({ errors, elapsed, onRestart }: CompletionOverlayProps) {
    return (
        <div className="completion-overlay">
            <div className="completion-card">
                <div className="completion-icon">✦</div>
                <h2 className="completion-title">Ferdig!</h2>
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
                <button className="completion-btn" onClick={onRestart}>
                    Spill igjen
                </button>
            </div>
        </div>
    );
}