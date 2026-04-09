// src/modes/daily/DailyCompletionOverlay.tsx
// Results overlay shown when the daily quiz is complete.

import { useState } from "react";
import { Confetti } from "../../components/ui/Confetti";
import { GAME_MODES } from "../../config/gameModes";
import type { DailyQuestion } from "../../types";

interface DailyCompletionOverlayProps {
    dayNumber: number;
    results: (boolean | null)[];
    perQuestionErrors: number[];
    questions: DailyQuestion[];
    correctCount: number;
    onBackToMenu: () => void;
    onRetry: () => void;
}

const MODE_EMOJI: Record<string, string> = { map: "\uD83D\uDDFA\uFE0F", shield: "\uD83D\uDEE1\uFE0F", reverse: "\uD83D\uDD04" };

function getPerformanceText(correctCount: number, total: number, totalErrors: number): { title: string; subtitle: string; icon: string } {
    const ratio = correctCount / total;
    const allCorrect = ratio === 1;

    if (allCorrect && totalErrors === 0) return { title: "Perfekt!", subtitle: "Uten en eneste feil!", icon: "\uD83C\uDFC6" };
    if (allCorrect && totalErrors < 5) return { title: "Utmerket!", subtitle: `Alle riktige med bare ${totalErrors} feil`, icon: "\uD83C\uDF89" };
    if (allCorrect && totalErrors <= 25) return { title: "Bra jobba!", subtitle: `Alle riktige \u2014 ${totalErrors} feil totalt`, icon: "\uD83D\uDD25" };
    if (allCorrect) return { title: "Alle riktige!", subtitle: `${totalErrors} feil \u2014 dette er vanskelig!`, icon: "\uD83D\uDCAA" };
    if (ratio >= 0.8 && totalErrors <= 25) return { title: "Nesten!", subtitle: "S\u00E5 n\u00E6r perfekt score", icon: "\uD83D\uDD25" };
    if (ratio >= 0.8) return { title: "Nesten!", subtitle: `${correctCount}/${total} riktige`, icon: "\uD83D\uDD25" };
    if (ratio >= 0.6) return { title: "Bra!", subtitle: "Over halvparten riktig", icon: "\uD83D\uDCAA" };
    if (ratio >= 0.4) return { title: "P\u00E5 rett vei", subtitle: "\u00D8v litt mer s\u00E5 knekker du det!", icon: "\uD83D\uDE04" };
    return { title: "Tung dag", subtitle: "Alle har d\u00E5rlige dager \u2014 pr\u00F8v igjen!", icon: "\uD83E\uDD14" };
}

function buildShareText(
    dayNumber: number,
    results: (boolean | null)[],
    questions: DailyQuestion[],
    correctCount: number,
    totalErrors: number,
): string {
    const lines: string[] = [];
    lines.push(`Kommune-quiz dag #${dayNumber}`);
    lines.push("");

    // Per-question line: mode emoji + result
    for (let i = 0; i < results.length; i++) {
        const mode = MODE_EMOJI[questions[i]?.mode ?? "map"] ?? "\uD83D\uDDFA\uFE0F";
        const result = results[i] === true ? "\u2705" : "\u274C";
        lines.push(`${mode} ${result}`);
    }

    lines.push("");
    lines.push(`${correctCount}/${results.length} riktige \u00B7 ${totalErrors} feil`);
    lines.push("");
    lines.push("Spill p\u00E5 kommulde.no");

    return lines.join("\n");
}

export function DailyCompletionOverlay({
    dayNumber,
    results,
    perQuestionErrors,
    questions,
    correctCount,
    onBackToMenu,
    onRetry,
}: DailyCompletionOverlayProps) {
    const [copied, setCopied] = useState(false);
    const totalErrors = perQuestionErrors.reduce((sum, e) => sum + e, 0);
    const allCorrect = correctCount === results.length;
    const perf = getPerformanceText(correctCount, results.length, totalErrors);

    const handleCopy = async () => {
        const text = buildShareText(dayNumber, results, questions, correctCount, totalErrors);
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Fallback: some browsers block clipboard in non-secure contexts
            return;
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="completion-overlay">
            {allCorrect && <Confetti />}
            <div className="completion-card">
                <div className="completion-icon">{perf.icon}</div>
                <h2 className="completion-title">{perf.title}</h2>
                <p className="completion-subtitle">{perf.subtitle}</p>

                <div className="completion-day-label">Dag #{dayNumber}</div>

                <div className="daily-results-grid">
                    {results.map((r, i) => {
                        const mode = questions[i]?.mode ?? "map";
                        const modeInfo = GAME_MODES.find((m) => m.mode === mode);
                        const errors = perQuestionErrors[i] ?? 0;
                        const correct = r === true;
                        return (
                            <div key={i} className={`daily-result-row ${correct ? "daily-result-correct" : "daily-result-wrong"}`}>
                                <span className="daily-result-mode">{modeInfo?.icon ?? "\uD83D\uDDFA\uFE0F"}</span>
                                <span className="daily-result-indicator">{correct ? "\u2713" : "\u2717"}</span>
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

                <div className="daily-actions">
                    <button className="completion-btn daily-share-btn" onClick={handleCopy}>
                        {copied ? "Kopiert! \u2713" : "\uD83D\uDCE4 Del resultat"}
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
