// src/modes/daily/DailyCompletionOverlay.tsx
// Results overlay shown when the daily quiz is complete.

import { useState } from "react";
import { Confetti } from "../../components/ui/Confetti";
import { GAME_MODES } from "../../config/gameModes";
import type { DailyQuestion } from "../../types";
import type { DailyHistory } from "../../utils/dailyStorage";

interface DailyCompletionOverlayProps {
    dayNumber: number;
    round: number;
    results: (boolean | null)[];
    perQuestionErrors: number[];
    questions: DailyQuestion[];
    correctCount: number;
    history: DailyHistory;
    onBackToMenu: () => void;
    onRetry: () => void;
    onPlayOneMore: () => void;
}

const MODE_EMOJI: Record<string, string> = { map: "🗺️", shield: "🛡️", reverse: "🔄" };

function getPerformanceText(correctCount: number, total: number, totalErrors: number): { title: string; subtitle: string; icon: string } {
    const ratio = correctCount / total;
    const allCorrect = ratio === 1;

    // "good" = all correct with ≤3 errors per question (avg), same threshold as yellow rows
    const avgErrors = total > 0 ? totalErrors / total : 0;

    if (allCorrect && totalErrors === 0) return { title: "Perfekt!", subtitle: "Uten en eneste feil!", icon: "🏆" };
    if (allCorrect && avgErrors <= 3) return { title: "Utmerket!", subtitle: `Alle riktige med ${totalErrors} feil totalt`, icon: "🎉" };
    if (allCorrect) return { title: "Bra jobba!", subtitle: `Alle riktige — ${totalErrors} feil totalt`, icon: "🔥" };
    if (ratio >= 0.8 && avgErrors <= 3) return { title: "Nesten perfekt!", subtitle: `${correctCount}/${total} riktige — veldig bra!`, icon: "🎉" };
    if (ratio >= 0.8) return { title: "Bra!", subtitle: `${correctCount}/${total} riktige`, icon: "💪" };
    if (ratio >= 0.6) return { title: "På rett vei!", subtitle: "Over halvparten riktig — fortsett sånn!", icon: "😄" };
    if (ratio >= 0.4) return { title: "Øv litt mer", subtitle: "Du klarer det neste gang!", icon: "😄" };
    return { title: "Tung dag", subtitle: "Alle har dårlige dager — prøv igjen!", icon: "🤔" };
}

function errorSquare(errors: number, correct: boolean): string {
    if (!correct) return "❌";
    if (errors === 0) return "🟩";
    if (errors <= 3) return "🟨";
    return "🟥";
}

function buildShareText(
    dayNumber: number,
    round: number,
    results: (boolean | null)[],
    perQuestionErrors: number[],
    questions: DailyQuestion[],
    correctCount: number,
    totalErrors: number,
    history: DailyHistory,
): string {
    const lines: string[] = [];
    const label = round === 0 ? `Kommune-quiz dag #${dayNumber}` : `Kommune-quiz bonusrunde #${round}`;
    lines.push(label);
    lines.push("");

    for (let i = 0; i < results.length; i++) {
        const mode = MODE_EMOJI[questions[i]?.mode ?? "map"] ?? "🗺️";
        const correct = results[i] === true;
        const errors = perQuestionErrors[i] ?? 0;
        const square = errorSquare(errors, correct);
        const suffix = correct ? `(${errors} feil)` : "(ga opp)";
        lines.push(`${mode} ${square} ${suffix}`);
    }

    lines.push("");
    lines.push(`${correctCount}/${results.length} riktige · ${totalErrors} feil`);

    if (history.stats.currentStreak >= 2) {
        lines.push(`🔥 ${history.stats.currentStreak} dager på rad`);
    }

    lines.push("");
    lines.push("Spill på kommulde.no");

    return lines.join("\n");
}

export function DailyCompletionOverlay({
    dayNumber,
    round,
    results,
    perQuestionErrors,
    questions,
    correctCount,
    history,
    onBackToMenu,
    onRetry,
    onPlayOneMore,
}: DailyCompletionOverlayProps) {
    const [copied, setCopied] = useState(false);
    const totalErrors = perQuestionErrors.reduce((sum, e) => sum + e, 0);
    const allCorrect = correctCount === results.length;
    const perf = getPerformanceText(correctCount, results.length, totalErrors);

    const handleCopy = async () => {
        const text = buildShareText(dayNumber, round, results, perQuestionErrors, questions, correctCount, totalErrors, history);
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const { stats } = history;

    return (
        <div className="completion-overlay">
            {allCorrect && <Confetti />}
            <div className="completion-card">
                <div className="completion-icon">{perf.icon}</div>
                <h2 className="completion-title">{perf.title}</h2>
                <p className="completion-subtitle">{perf.subtitle}</p>

                <div className="completion-day-label">
                    {round === 0 ? `Dag #${dayNumber}` : `Bonusrunde #${round}`}
                </div>

                <div className="daily-results-grid">
                    {results.map((r, i) => {
                        const mode = questions[i]?.mode ?? "map";
                        const modeInfo = GAME_MODES.find((m) => m.mode === mode);
                        const errors = perQuestionErrors[i] ?? 0;
                        const correct = r === true;
                        const rowClass = !correct
                            ? "daily-result-wrong"
                            : errors === 0
                                ? "daily-result-correct"
                                : errors <= 3
                                    ? "daily-result-close"
                                    : "daily-result-wrong";
                        const indicator = !correct
                            ? "✗"
                            : errors <= 3
                                ? "✓"
                                : "✗";
                        return (
                            <div key={i} className={`daily-result-row ${rowClass}`}>
                                <span className="daily-result-mode">{modeInfo?.icon ?? "🗺️"}</span>
                                <span className="daily-result-indicator">{indicator}</span>
                                {errors > 0 && (
                                    <span className="daily-result-errors">{errors} feil</span>
                                )}
                            </div>
                        );
                    })}
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

                {stats.totalPlayed > 0 && (
                    <div className="daily-streak-row">
                        {stats.currentStreak >= 1 && (
                            <div className="daily-streak-item">
                                <span className="daily-streak-value">{stats.currentStreak}</span>
                                <span className="daily-streak-label">dager på rad</span>
                            </div>
                        )}
                        {stats.longestStreak > 1 && (
                            <div className="daily-streak-item">
                                <span className="daily-streak-value">{stats.longestStreak}</span>
                                <span className="daily-streak-label">lengste</span>
                            </div>
                        )}
                        <div className="daily-streak-item">
                            <span className="daily-streak-value">{stats.totalPlayed}</span>
                            <span className="daily-streak-label">spilt</span>
                        </div>
                    </div>
                )}

                <div className="daily-actions">
                    <button className="completion-btn daily-share-btn" onClick={handleCopy}>
                        {copied ? "Kopiert! ✓" : "📤 Del resultat"}
                    </button>
                    <button className="completion-btn daily-play-more-btn" onClick={onPlayOneMore}>
                        ▶ Spill en til
                    </button>
                    <button className="completion-btn daily-retry-btn" onClick={onRetry}>
                        ↺ Prøv igjen
                    </button>
                    <button className="completion-btn" onClick={onBackToMenu}>
                        Fri trening
                    </button>
                </div>
            </div>
        </div>
    );
}
