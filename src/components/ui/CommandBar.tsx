// src/components/ui/CommandBar.tsx
// Unified command bar: target display, progress, stats, tools, and actions.
// Replaces separate GameHeader + toolbar + FylkeSelector + LensToggle.

import { KommuneShield } from "./KommuneShield";

interface CommandBarProps {
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
    fylker: { fylkesnummer: string; fylkenavn: string }[];
    selectedFylke: string | null;
    onFylkeChange: (fylkesnummer: string | null) => void;
    lensEnabled: boolean;
    onLensToggle: () => void;
    fylkeHintEnabled: boolean;
    onFylkeHintToggle: () => void;
}

export function CommandBar({
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
                               fylker,
                               selectedFylke,
                               onFylkeChange,
                               lensEnabled,
                               onLensToggle,
                               fylkeHintEnabled,
                               onFylkeHintToggle,
                           }: CommandBarProps) {
    const progress = total > 0 ? (currentIndex / total) * 100 : 0;

    return (
        <div className="command-bar">
            {/* Left: region selector */}
            <div className="cb-region">
                <select
                    className="cb-select"
                    value={selectedFylke ?? ""}
                    onChange={(e) => onFylkeChange(e.target.value || null)}
                >
                    <option value="">Hele Norge</option>
                    {fylker.map(({ fylkesnummer, fylkenavn }) => (
                        <option key={fylkesnummer} value={fylkesnummer}>
                            {fylkenavn}
                        </option>
                    ))}
                </select>
            </div>

            {/* Center: target + progress */}
            <div className="cb-center">
                {!isComplete && (
                    <>
                        <div className="cb-target">
                            <span className="cb-label">Finn</span>
                            <KommuneShield kommunenummer={currentKommunenummer} />
                            <strong className="cb-name">{currentName}</strong>
                            {showFylke && <span className="cb-fylke">{currentFylke}</span>}
                        </div>
                        <div className="cb-progress-track">
                            <div className="cb-progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                    </>
                )}
            </div>

            {/* Right: stats + actions */}
            <div className="cb-controls">
                <div className="cb-stats">
                    <span className="cb-stat">
                        <span className="cb-stat-value">{currentIndex}</span>
                        <span className="cb-stat-label">/{total}</span>
                    </span>
                    <span className="cb-stat cb-stat-errors">
                        <span className="cb-stat-value">{errors}</span>
                        <span className="cb-stat-label">feil</span>
                    </span>
                    <span className="cb-timer">{elapsed}</span>
                </div>
                <div className="cb-actions">
                    <button
                        className={`cb-tool ${lensEnabled ? "cb-tool-active" : ""}`}
                        onClick={onLensToggle}
                        title="Forstørrelsesglass"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                    </button>
                    <button
                        className={`cb-tool ${fylkeHintEnabled ? "cb-tool-active" : ""}`}
                        onClick={onFylkeHintToggle}
                        title="Vis fylke"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" />
                            <path d="M9 4v13" />
                            <path d="M15 7v13" />
                        </svg>
                    </button>
                    <div className="cb-divider" />
                    {!isComplete && (
                        <button className="cb-btn cb-btn-ghost" onClick={onSkip}>
                            Hopp over
                        </button>
                    )}
                    <button className="cb-btn cb-btn-ghost" onClick={onRestart}>
                        ↺
                    </button>
                </div>
            </div>
        </div>
    );
}