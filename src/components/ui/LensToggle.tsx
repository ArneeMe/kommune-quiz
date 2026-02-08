// src/components/ui/LensToggle.tsx
// Toggle button to enable/disable the magnifying lens on the map.

interface LensToggleProps {
    enabled: boolean;
    onToggle: () => void;
}

export function LensToggle({ enabled, onToggle }: LensToggleProps) {
    return (
        <button className="lens-toggle" onClick={onToggle}>
            {enabled ? "🔍 Lens On" : "🔍 Lens Off"}
        </button>
    );
}