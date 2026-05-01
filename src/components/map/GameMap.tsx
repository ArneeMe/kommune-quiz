// src/components/map/GameMap.tsx
// Main map SVG. Scroll-wheel + pinch zoom, drag-to-pan.
// ViewBox-based zoom keeps click coordinates accurate.

import { useCallback, useEffect, useMemo } from "react";
import { geoPath } from "d3-geo";
import { useMapPaths } from "../../hooks/useMapPaths";
import { useMapZoom } from "../../hooks/useMapZoom";
import { KommuneShape } from "./KommuneShape";
import { FylkeBorders } from "./FylkeBorders";
import { ArrowHint } from "./ArrowHint";
import { buildFeatureMap, noop } from "../../utils/featureLookup";
import type { KommuneFeature } from "../../types";

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
    /** When this value changes, zoom resets to 1x. Use e.g. question index. */
    resetKey?: number | string;
    /** Auto-zoom to the bounds of this fylke when it changes. */
    focusFylke?: string | null;
}

export function GameMap({ allFeatures, activeFeatures, solved, onGuess, highlightedKommune, justSolved, wrongGuess, arrowHint, resetKey, focusFylke }: GameMapProps) {
    const { pathGenerator, viewBox: baseViewBox, activeSet, allPaths, isFiltered } =
        useMapPaths(allFeatures, activeFeatures);

    const { svgRef, viewBox, isZoomed, resetZoom, zoomToBox, zoomIn, zoomOut, handlers } = useMapZoom(baseViewBox);

    // Reset zoom when resetKey changes (e.g. new daily question)
    useEffect(() => {
        resetZoom();
    }, [resetKey, resetZoom]);

    // Auto-zoom to fylke bounds when focusFylke changes
    useEffect(() => {
        if (!focusFylke) return;
        const fylkeFeatures = allFeatures.filter(
            (f) => f.properties.fylkenavn === focusFylke,
        );
        if (fylkeFeatures.length === 0) return;

        const pg = pathGenerator as ReturnType<typeof geoPath>;
        // Compute bounding box over all features in the fylke
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const feature of fylkeFeatures) {
            const bounds = pg.bounds(feature as unknown as GeoJSON.Feature);
            if (!bounds || isNaN(bounds[0][0])) continue;
            x0 = Math.min(x0, bounds[0][0]);
            y0 = Math.min(y0, bounds[0][1]);
            x1 = Math.max(x1, bounds[1][0]);
            y1 = Math.max(y1, bounds[1][1]);
        }
        if (!isFinite(x0)) return;
        zoomToBox([[x0, y0], [x1, y1]]);
    }, [focusFylke, allFeatures, pathGenerator, zoomToBox]);

    // Build a feature lookup for centroid computation
    const featureMap = useMemo(() => buildFeatureMap(allFeatures), [allFeatures]);

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

        if (!fromCenter || !toCenter ||
            isNaN(fromCenter[0]) || isNaN(fromCenter[1]) ||
            isNaN(toCenter[0]) || isNaN(toCenter[1])) return null;

        return { fromX: fromCenter[0], fromY: fromCenter[1], toX: toCenter[0], toY: toCenter[1] };
    }, [arrowHint, featureMap, pathGenerator]);

    return (
        <div className="game-map-wrapper" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            <div className="zoom-controls">
                <button
                    className="zoom-btn"
                    onClick={zoomIn}
                    aria-label="Zoom inn"
                >+</button>
                <button
                    className="zoom-btn"
                    onClick={zoomOut}
                    disabled={!isZoomed}
                    aria-label="Zoom ut"
                >−</button>
                {isZoomed && (
                    <button className="zoom-btn zoom-reset-btn" onClick={resetZoom} aria-label="Tilbakestill zoom">
                        ↺
                    </button>
                )}
            </div>
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
