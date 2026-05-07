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
    isJustSolved?: boolean;
    isWrongGuess?: boolean;
}

export const KommuneShape = memo(function KommuneShape({
    d,
    kommunenummer,
    isSolved,
    isInactive,
    isHighlighted,
    isJustSolved,
    isWrongGuess,
}: KommuneShapeProps) {
    let className = "kommune-shape";
    if (isSolved) className += " kommune-solved";
    if (isInactive) className += " kommune-inactive";
    if (isHighlighted) className += " kommune-highlighted";
    if (isJustSolved) className += " kommune-just-solved";
    if (isWrongGuess) className += " kommune-wrong";

    return (
        <path
            d={d}
            className={className}
            data-id={kommunenummer}
        />
    );
});
