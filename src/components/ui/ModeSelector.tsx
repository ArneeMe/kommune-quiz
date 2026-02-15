// src/components/ui/ModeSelector.tsx
// Game mode selector — segmented button group.

import { GAME_MODES } from "../../config/gameModes";
import type { GameMode } from "../../types";

interface ModeSelectorProps {
    selected: GameMode;
    onChange: (mode: GameMode) => void;
}

export function ModeSelector({ selected, onChange }: ModeSelectorProps) {
    return (
        <div className="mode-selector">
            {GAME_MODES.map(({ mode, label, icon }) => (
                <button
                    key={mode}
                    className={`mode-btn ${selected === mode ? "mode-btn-active" : ""}`}
                    onClick={() => onChange(mode)}
                    title={label}
                >
                    <span className="mode-btn-icon">{icon}</span>
                    <span className="mode-btn-label">{label}</span>
                </button>
            ))}
        </div>
    );
}