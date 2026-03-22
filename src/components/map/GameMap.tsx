// src/components/map/GameMap.tsx
// Main map SVG. Scroll-wheel + pinch zoom, drag-to-pan.
// ViewBox-based zoom keeps click coordinates accurate.

import { useCallback, useMemo } from "react";
import { geoPath } from "d3-geo";
import { useMapPaths } from "../../hooks/useMapPaths";
import { useMapZoom } from "../../hooks/useMapZoom";
import { KommuneShape } from "./KommuneShape";
import { FylkeBorders } from "./FylkeBorders";
import { ArrowHint } from "./ArrowHint";
import type { KommuneFeature } from "../../types";

const noop = () => {};

interface ArrowHintData {
    fromKommune: string;
    toKommune: string;
}

interface GameMapProps {
    allFeatures: KommuneFeature[];
    activeFeatures: KommuneFeature[];
    solved: Set<string>;
    onGuess: (kommunenummer: string) => void;
    highlightedKommune?: string | null;
    justSolved?: string | null;
    wrongGuess?: string | null;
    arrowHint?: ArrowHintData;
}

export function GameMap({ allFeatures, activeFeatures, solved, onGuess, highlightedKommune, justSolved, wrongGuess, arrowHint }: GameMapProps) {
    const { pathGenerator, viewBox: baseViewBox, activeSet, allPaths, isFiltered } =
        useMapPaths(allFeatures, activeFeatures);

    const { svgRef, viewBox, isZoomed, resetZoom, handlers } = useMapZoom(baseViewBox);

    // Build a feature lookup for centroid computation
    const featureMap = useMemo(() => {
        const map = new Map<string, KommuneFeature>();
        for (const f of allFeatures) {
            map.set(f.properties.kommunenummer, f);
        }
        return map;
    }, [allFeatures]);

    // Merge the ref callback
    const setRef = useCallback((el: SVGSVGElement | null) => {
        svgRef(el);
    }, [svgRef]);

    // Compute arrow hint coordinates using geoPath centroid with our projection
    const arrowCoords = useMemo(() => {
        if (!arrowHint) return null;
        const fromFeature = featureMap.get(arrowHint.fromKommune);
        const toFeature = featureMap.get(arrowHint.toKommune);
        if (!fromFeature || !toFeature) return null;

        // Use the pathGenerator (which is a d3 geoPath) to compute centroids
        // We cast to any because our type is narrowed to string|null but it's actually a full geoPath
        const pg = pathGenerator as ReturnType<typeof geoPath>;
        const fromCenter = pg.centroid(fromFeature as unknown as GeoJSON.Feature);
        const toCenter = pg.centroid(toFeature as unknown as GeoJSON.Feature);

        if (!fromCenter || !toCenter || isNaN(fromCenter[0]) || isNaN(toCenter[0])) return null;

        return { fromX: fromCenter[0], fromY: fromCenter[1], toX: toCenter[0], toY: toCenter[1] };
    }, [arrowHint, featureMap, pathGenerator]);

    return (
        <div className="game-map-wrapper" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            {isZoomed && (
                <button className="zoom-reset-btn" onClick={resetZoom} aria-label="Tilbakestill zoom">
                    ↺
                </button>
            )}
            <svg
                ref={setRef}
                viewBox={viewBox}
                className="game-map"
                style={{ cursor: isZoomed ? "grab" : undefined }}
                {...handlers}
            >
                <g className="map-base">
                    {allPaths.map(({ d, kommunenummer }) => {
                        const isActive = activeSet.has(kommunenummer);
                        const isInactive = isFiltered && !isActive;
                        const isHighlighted = kommunenummer === highlightedKommune;
                        return (
                            <KommuneShape
                                key={kommunenummer}
                                d={d}
                                kommunenummer={kommunenummer}
                                isSolved={solved.has(kommunenummer)}
                                isInactive={isInactive}
                                isHighlighted={isHighlighted}
                                isJustSolved={kommunenummer === justSolved}
                                isWrongGuess={kommunenummer === wrongGuess}
                                onSelect={isInactive ? noop : onGuess}
                            />
                        );
                    })}
                </g>

                <FylkeBorders pathGenerator={pathGenerator} />

                {arrowCoords && (
                    <ArrowHint
                        fromX={arrowCoords.fromX}
                        fromY={arrowCoords.fromY}
                        toX={arrowCoords.toX}
                        toY={arrowCoords.toY}
                    />
                )}
            </svg>
        </div>
    );
}
