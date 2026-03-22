// src/components/map/GameMap.tsx
// Main map SVG. Scroll-wheel + pinch zoom, drag-to-pan.
// ViewBox-based zoom keeps click coordinates accurate.

import { useCallback } from "react";
import { useMapPaths } from "../../hooks/useMapPaths";
import { useMapZoom } from "../../hooks/useMapZoom";
import { KommuneShape } from "./KommuneShape";
import { FylkeBorders } from "./FylkeBorders";
import type { KommuneFeature } from "../../types";

const noop = () => {};

interface GameMapProps {
    allFeatures: KommuneFeature[];
    activeFeatures: KommuneFeature[];
    solved: Set<string>;
    onGuess: (kommunenummer: string) => void;
    highlightedKommune?: string | null;
    justSolved?: string | null;
    wrongGuess?: string | null;
}

export function GameMap({ allFeatures, activeFeatures, solved, onGuess, highlightedKommune, justSolved, wrongGuess }: GameMapProps) {
    const { pathGenerator, viewBox: baseViewBox, activeSet, allPaths, isFiltered } =
        useMapPaths(allFeatures, activeFeatures);

    const { svgRef, viewBox, isZoomed, resetZoom, handlers } = useMapZoom(baseViewBox);

    // Merge the ref callback
    const setRef = useCallback((el: SVGSVGElement | null) => {
        svgRef(el);
    }, [svgRef]);

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
            </svg>
        </div>
    );
}
