// src/modes/daily/DailyCompletionOverlay.tsx
// Results overlay shown when the daily quiz is complete.

import { useState } from "react";
import { Confetti } from "../../components/ui/Confetti";

interface DailyCompletionOverlayProps {
    dayNumber: number;
    results: (boolean | null)[];
    perQuestionErrors: number[];
    correctCount: number;
    onBackToMenu: () => void;
    onRetry: () => void;
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
    onRetry,
}: DailyCompletionOverlayProps) {
    const [copied, setCopied] = useState(false);
    const totalErrors = perQuestionErrors.reduce((sum, e) => sum + e, 0);
    const allCorrect = correctCount === results.length;

    const handleCopy = async () => {
        const text = buildShareText(dayNumber, results, correctCount);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="completion-overlay">
            {allCorrect && <Confetti />}
            <div className="completion-card">
                <div className="completion-icon">{allCorrect ? "\uD83C\uDF89" : "\uD83D\uDCCA"}</div>
                <h2 className="completion-title">
                    {allCorrect ? "Perfekt!" : `Dag #${dayNumber}`}
                </h2>

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
                        {copied ? "Kopiert! \u2713" : "Del resultat"}
                    </button>
                    <button className="completion-btn daily-retry-btn" onClick={onRetry}>
                        {"\u21BA"} Pr\u00F8v igjen
                    </button>
                    <button className="completion-btn" onClick={onBackToMenu}>
                        Fri trening
                    </button>
                </div>
            </div>
        </div>
    );
}
