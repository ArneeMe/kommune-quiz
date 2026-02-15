// src/components/map/GameMap.tsx
// Main map SVG. Renders ALL kommune shapes (inactive ones dimmed).
// ViewBox zooms to active subset. Lens only shows active kommuner.

import { useCallback, useRef, useState } from "react";
import { useMapPaths } from "../../hooks/useMapPaths";
import { KommuneShape } from "./KommuneShape";
import { MagnifyingLens } from "./MagnifyingLens";
import { FylkeBorders } from "./FylkeBorders";
import type { KommuneFeature } from "../../types";

const noop = () => {};

interface GameMapProps {
    allFeatures: KommuneFeature[];
    activeFeatures: KommuneFeature[];
    lensEnabled: boolean;
    solved: Set<string>;
    onGuess: (kommunenummer: string) => void;
}

export function GameMap({ allFeatures, activeFeatures, lensEnabled, solved, onGuess }: GameMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

    const { pathGenerator, viewBox, activeSet, allPaths, activePaths, isFiltered } =
        useMapPaths(allFeatures, activeFeatures);

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
                {allPaths.map(({ d, kommunenummer }) => {
                    const isActive = activeSet.has(kommunenummer);
                    const isInactive = isFiltered && !isActive;
                    return (
                        <KommuneShape
                            key={kommunenummer}
                            d={d}
                            kommunenummer={kommunenummer}
                            isSolved={solved.has(kommunenummer)}
                            isInactive={isInactive}
                            onSelect={isInactive ? noop : onGuess}
                        />
                    );
                })}
            </g>

            <FylkeBorders pathGenerator={pathGenerator} />

            {showLens && (
                <MagnifyingLens
                    mouse={mouse}
                    paths={activePaths}
                    solved={solved}
                    onGuess={onGuess}
                />
            )}
        </svg>
    );
}