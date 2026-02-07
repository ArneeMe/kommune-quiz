// src/components/GameMap.tsx

import { useMemo, useCallback, useRef, useState } from "react";
import { useMapData } from "../hooks/useMapData";
import { createPathGenerator } from "../utils/geo";
import { KommuneShape } from "./KommuneShape";

const LENS_RADIUS = 50;
const ZOOM = 2;

interface GameMapProps {
    lensEnabled: boolean;
    solved: Set<string>;
    onGuess: (kommunenummer: string) => void;
}

export function GameMap({ lensEnabled, solved, onGuess }: GameMapProps) {
    const { features } = useMapData();
    const svgRef = useRef<SVGSVGElement>(null);
    const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

    const { pathGenerator, viewBox } = useMemo(
        () => createPathGenerator(features),
        [features]
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

    const paths = useMemo(() =>
            features.map((feature) => ({
                d: pathGenerator(feature) ?? "",
                kommunenummer: feature.properties.kommunenummer,
            })).filter((p) => p.d),
        [features, pathGenerator]
    );

    const lensId = "magnifying-lens";
    const showLens = lensEnabled && mouse;

    return (
        <svg
            ref={svgRef}
            viewBox={viewBox}
            className="game-map"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <defs>
                {showLens && (
                    <clipPath id={lensId}>
                        <circle cx={mouse.x} cy={mouse.y} r={LENS_RADIUS} />
                    </clipPath>
                )}
            </defs>

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
                <>
                    <g clipPath={`url(#${lensId})`}>
                        <g
                            transform={`translate(${mouse.x}, ${mouse.y}) scale(${ZOOM}) translate(${-mouse.x}, ${-mouse.y})`}
                        >
                            {paths.map(({ d, kommunenummer }) => (
                                <path
                                    key={kommunenummer}
                                    d={d}
                                    className={`kommune-shape ${solved.has(kommunenummer) ? "kommune-solved" : ""}`}
                                    data-id={kommunenummer}
                                    onClick={solved.has(kommunenummer) ? undefined : () => onGuess(kommunenummer)}
                                />
                            ))}
                        </g>
                    </g>

                    <circle
                        cx={mouse.x}
                        cy={mouse.y}
                        r={LENS_RADIUS}
                        className="lens-border"
                    />
                </>
            )}
        </svg>
    );
}