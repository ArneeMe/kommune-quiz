// src/components/KommuneShape.tsx

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