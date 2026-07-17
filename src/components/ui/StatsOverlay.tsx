// src/components/ui/StatsOverlay.tsx
// Local statistics: daily-quiz streaks + results calendar and freeplay
// personal bests. Everything comes from localStorage — nothing leaves the device.

import { GAME_MODES } from "../../config/gameModes";
import { formatTime } from "../../hooks/useTimer";
import { buildCalendarWeeks } from "../../utils/statsCalendar";
import { loadBestTimes } from "../../utils/bestTimes";
import type { DailyHistory } from "../../utils/dailyStorage";

interface StatsOverlayProps {
    history: DailyHistory;
    fylker: { fylkesnummer: string; fylkenavn: string }[];
    onClose: () => void;
}

const WEEK_COUNT = 8;
const WEEKDAY_LABELS = ["M", "T", "O", "T", "F", "L", "S"];

export function StatsOverlay({ history, fylker, onClose }: StatsOverlayProps) {
    const weeks = buildCalendarWeeks(history.days, WEEK_COUNT, new Date());
    const fylkeNames = new Map(fylker.map((f) => [f.fylkesnummer, f.fylkenavn]));

    const playedDays = Object.values(history.days);
    const avgErrors = playedDays.length > 0
        ? (playedDays.reduce((sum, d) => sum + d.totalErrors, 0) / playedDays.length).toFixed(1)
        : "–";

    const bestTimes = loadBestTimes();
    const bestEntries = GAME_MODES.flatMap((modeInfo) =>
        Object.entries(bestTimes)
            .filter(([key]) => key.startsWith(`${modeInfo.mode}:`))
            .map(([key, best]) => {
                const fylkesnummer = key.slice(modeInfo.mode.length + 1);
                const scope = fylkesnummer === "all"
                    ? "Hele Norge"
                    : fylkeNames.get(fylkesnummer) ?? fylkesnummer;
                return { key, modeInfo, scope, best };
            })
    );

    const { stats } = history;
    const statItems = [
        { value: String(stats.currentStreak), label: "dager på rad" },
        { value: String(stats.longestStreak), label: "lengste" },
        { value: String(stats.totalPlayed), label: "spilt" },
        { value: String(stats.totalPerfect), label: "perfekte" },
        { value: avgErrors, label: "snitt feil" },
    ];

    return (
        <div className="completion-overlay" onClick={onClose}>
            <div className="completion-card stats-card" onClick={(e) => e.stopPropagation()}>
                <button className="stats-close" onClick={onClose} aria-label="Lukk">✕</button>
                <h2 className="completion-title stats-title">📊 Statistikk</h2>

                <div className="daily-streak-row stats-summary">
                    {statItems.map(({ value, label }) => (
                        <div key={label} className="daily-streak-item">
                            <span className="daily-streak-value">{value}</span>
                            <span className="daily-streak-label">{label}</span>
                        </div>
                    ))}
                </div>

                <h3 className="stats-section-title">Dagens quiz — siste {WEEK_COUNT} uker</h3>
                <div className="stats-calendar">
                    <div className="stats-calendar-row stats-calendar-header">
                        {WEEKDAY_LABELS.map((label, i) => (
                            <span key={i} className="stats-calendar-weekday">{label}</span>
                        ))}
                    </div>
                    {weeks.map((week) => (
                        <div key={week[0].dateKey} className="stats-calendar-row">
                            {week.map((day) => (
                                <span
                                    key={day.dateKey}
                                    className={`stats-day stats-day-${day.state} ${day.isToday ? "stats-day-today" : ""}`}
                                    title={day.dateKey}
                                >
                                    {day.dayOfMonth}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="stats-legend">
                    <span><i className="stats-day stats-day-perfect" /> Perfekt</span>
                    <span><i className="stats-day stats-day-complete" /> Alle riktige</span>
                    <span><i className="stats-day stats-day-partial" /> Delvis</span>
                    <span><i className="stats-day stats-day-poor" /> Tøff dag</span>
                </div>

                <h3 className="stats-section-title">Rekorder — fri trening</h3>
                {bestEntries.length === 0 ? (
                    <p className="stats-empty">
                        Fullfør en runde i fri trening for å sette din første rekord! 🏅
                    </p>
                ) : (
                    <div className="stats-best-list">
                        {bestEntries.map(({ key, modeInfo, scope, best }) => (
                            <div key={key} className="stats-best-row">
                                <span className="stats-best-mode">{modeInfo.icon} {modeInfo.label}</span>
                                <span className="stats-best-scope">{scope}</span>
                                <span className="stats-best-value">
                                    {formatTime(best.timeSeconds)} · {best.errors} feil
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <button className="completion-btn" onClick={onClose}>
                    Lukk
                </button>
            </div>
        </div>
    );
}
