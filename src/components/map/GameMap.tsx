// src/components/map/GameMap.tsx
// Main map SVG. Renders kommune shapes and optionally the magnifying lens.
// Receives all data via props — does not call useMapData.

import { useMemo, useCallback, useRef, useState } from "react";
import { createPathGenerator } from "../../utils/geo";
import { KommuneShape } from "./KommuneShape";
import { MagnifyingLens } from "./MagnifyingLens";
import type { KommuneFeature, KommunePath } from "../../types";

interface GameMapProps {
    features: KommuneFeature[];
    lensEnabled: boolean;
    solved: Set<string>;
    onGuess: (kommunenummer: string) => void;
}

export function GameMap({ features, lensEnabled, solved, onGuess }: GameMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

    const { pathGenerator, viewBox } = useMemo(
        () => createPathGenerator(features),
        [features]
    );

    const paths: KommunePath[] = useMemo(() =>
            features
                .map((feature) => ({
                    d: pathGenerator(feature) ?? "",
                    kommunenummer: feature.properties.kommunenummer,
                }))
                .filter((p) => p.d),
        [features, pathGenerator]
    );

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        const svg = svgRef.current;
        if (!svg) return;
        const point = svg.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;
        const svgPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
        setMouse({ x: svgPoint.x, y: svgPoint.y });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setMouse(null);
    }, []);

    const showLens = lensEnabled && mouse !== null;

    return (
        <svg
            ref={svgRef}
            viewBox={viewBox}
            className="game-map"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <g className="map-base">
                {paths.map(({ d, kommunenummer }) => (
                    <KommuneShape
                        key={kommunenummer}
                        d={d}
                        kommunenummer={kommunenummer}
                        isSolved={solved.has(kommunenummer)}
                        onSelect={onGuess}
                    />
                ))}
            </g>

            {showLens && (
                <MagnifyingLens
                    mouse={mouse}
                    paths={paths}
                    solved={solved}
                    onGuess={onGuess}
                />
            )}
        </svg>
    );
}