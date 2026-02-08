// src/components/map/GameMap.tsx
// Main map SVG. Renders ALL kommune shapes (inactive ones dimmed).
// ViewBox zooms to active subset. Lens only shows active kommuner.

import { useMemo, useCallback, useRef, useState } from "react";
import { createPathGenerator } from "../../utils/geo";
import { KommuneShape } from "./KommuneShape";
import { MagnifyingLens } from "./MagnifyingLens";
import { FylkeBorders } from "./FylkeBorders";
import type { KommuneFeature, KommunePath } from "../../types";

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

    const isFiltered = activeFeatures.length < allFeatures.length;

    // Projection based on ALL features; computeViewBox zooms to any subset
    const { pathGenerator, computeViewBox } = useMemo(
        () => createPathGenerator(allFeatures),
        [allFeatures]
    );

    // ViewBox zooms to active subset
    const viewBox = useMemo(
        () => computeViewBox(activeFeatures),
        [computeViewBox, activeFeatures]
    );

    // Build active set for quick lookup
    const activeSet = useMemo(
        () => new Set(activeFeatures.map((f) => f.properties.kommunenummer)),
        [activeFeatures]
    );

    // Paths for ALL kommuner
    const allPaths: KommunePath[] = useMemo(() =>
            allFeatures
                .map((feature) => ({
                    d: pathGenerator(feature) ?? "",
                    kommunenummer: feature.properties.kommunenummer,
                }))
                .filter((p) => p.d),
        [allFeatures, pathGenerator]
    );

    // Paths for active kommuner only (used by lens)
    const activePaths = useMemo(() =>
            allPaths.filter((p) => activeSet.has(p.kommunenummer)),
        [allPaths, activeSet]
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