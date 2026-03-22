// src/modes/daily/DailyCompletionOverlay.tsx
// Results overlay shown when the daily quiz is complete.
// Shows emoji grid and copy-to-clipboard share button.

import { useState } from "react";

interface DailyCompletionOverlayProps {
    dayNumber: number;
    results: (boolean | null)[];
    perQuestionErrors: number[];
    correctCount: number;
    onBackToMenu: () => void;
}

function buildShareText(dayNumber: number, results: (boolean | null)[], correctCount: number): string {
    const grid = results
        .map((r) => (r === true ? "\u{1F7E9}" : "\u{1F7E5}"))
        .join("");
    return `Kommune-quiz #${dayNumber}\n${grid} ${correctCount}/${results.length}`;
}

export function DailyCompletionOverlay({
    dayNumber,
    results,
    perQuestionErrors,
    correctCount,
    onBackToMenu,
}: DailyCompletionOverlayProps) {
    const [copied, setCopied] = useState(false);
    const totalErrors = perQuestionErrors.reduce((sum, e) => sum + e, 0);

    const handleCopy = async () => {
        const text = buildShareText(dayNumber, results, correctCount);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="completion-overlay">
            <div className="completion-card">
                <div className="completion-icon">{"\u2726"}</div>
                <h2 className="completion-title">Dagens quiz #{dayNumber}</h2>

                <div className="daily-emoji-grid">
                    {results.map((r, i) => (
                        <span key={i} className="daily-emoji">
                            {r === true ? "\u{1F7E9}" : "\u{1F7E5}"}
                        </span>
                    ))}
                </div>

                <div className="completion-stats">
                    <div className="completion-stat">
                        <span className="completion-stat-value">{correctCount}/{results.length}</span>
                        <span className="completion-stat-label">riktige</span>
                    </div>
                    <div className="completion-stat-divider" />
                    <div className="completion-stat">
                        <span className="completion-stat-value">{totalErrors}</span>
                        <span className="completion-stat-label">feil</span>
                    </div>
                </div>

                <div className="daily-actions">
                    <button className="completion-btn daily-share-btn" onClick={handleCopy}>
                        {copied ? "Kopiert!" : "Kopier resultat"}
                    </button>
                    <button className="completion-btn" onClick={onBackToMenu}>
                        Tilbake
                    </button>
                </div>
            </div>
        </div>
    );
}
