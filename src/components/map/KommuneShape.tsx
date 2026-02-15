// src/components/map/KommuneShape.tsx
// Renders a single kommune as an SVG path.
// Pure presentational — knows nothing about game logic.

import { memo } from "react";

interface KommuneShapeProps {
    d: string;
    kommunenummer: string;
    isSolved: boolean;
    isInactive?: boolean;
    isHighlighted?: boolean;
    onSelect: (kommunenummer: string) => void;
}

export const KommuneShape = memo(function KommuneShape({
                                                           d,
                                                           kommunenummer,
                                                           isSolved,
                                                           isInactive,
                                                           isHighlighted,
                                                           onSelect,
                                                       }: KommuneShapeProps) {
    const className = [
        "kommune-shape",
        isSolved ? "kommune-solved" : "",
        isInactive ? "kommune-inactive" : "",
        isHighlighted ? "kommune-highlighted" : "",
    ].filter(Boolean).join(" ");

    return (
        <path
            d={d}
            className={className}
            data-id={kommunenummer}
            onClick={isSolved || isInactive ? undefined : () => onSelect(kommunenummer)}
        />
    );
});