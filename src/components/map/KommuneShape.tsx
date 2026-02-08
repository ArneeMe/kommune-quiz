// src/components/map/KommuneShape.tsx
// Renders a single kommune as an SVG path.
// Pure presentational — knows nothing about game logic.

import { memo } from "react";

interface KommuneShapeProps {
    d: string;
    kommunenummer: string;
    isSolved: boolean;
    onSelect: (kommunenummer: string) => void;
}

export const KommuneShape = memo(function KommuneShape({
                                                           d,
                                                           kommunenummer,
                                                           isSolved,
                                                           onSelect,
                                                       }: KommuneShapeProps) {
    return (
        <path
            d={d}
            className={`kommune-shape ${isSolved ? "kommune-solved" : ""}`}
            data-id={kommunenummer}
            onClick={isSolved ? undefined : () => onSelect(kommunenummer)}
        />
    );
});