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
    onSelect: (kommunenummer: string) => void;
}

export const KommuneShape = memo(function KommuneShape({
                                                           d,
                                                           kommunenummer,
                                                           isSolved,
                                                           isInactive,
                                                           isHighlighted,
                                                           isJustSolved,
                                                           isWrongGuess,
                                                           onSelect,
                                                       }: KommuneShapeProps) {
    const className = [
        "kommune-shape",
        isSolved ? "kommune-solved" : "",
        isInactive ? "kommune-inactive" : "",
        isHighlighted ? "kommune-highlighted" : "",
        isJustSolved ? "kommune-just-solved" : "",
        isWrongGuess ? "kommune-wrong" : "",
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
