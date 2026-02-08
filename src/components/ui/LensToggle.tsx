// src/components/ui/LensToggle.tsx
// Generic toggle button for toolbar options.

interface LensToggleProps {
    label: string;
    enabled: boolean;
    onToggle: () => void;
}

export function LensToggle({ label, enabled, onToggle }: LensToggleProps) {
    return (
        <button
            className={`lens-toggle ${enabled ? "lens-toggle-active" : ""}`}
            onClick={onToggle}
        >
            {label}
        </button>
    );
}