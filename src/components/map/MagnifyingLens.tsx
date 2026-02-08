// src/components/map/MagnifyingLens.tsx
// Renders a circular magnifying lens that follows the cursor.
// Shows a zoomed duplicate of the map paths inside a clip circle.

import type { KommunePath } from "../../types";

const LENS_RADIUS = 30;
const ZOOM = 3;
const CLIP_ID = "magnifying-lens";

interface MagnifyingLensProps {
    mouse: { x: number; y: number };
    paths: KommunePath[];
    solved: Set<string>;
    onGuess: (kommunenummer: string) => void;
}

export function MagnifyingLens({ mouse, paths, solved, onGuess }: MagnifyingLensProps) {
    return (
        <>
            {/* Clip definition — placed here so it updates with mouse position */}
            <defs>
                <clipPath id={CLIP_ID}>
                    <circle cx={mouse.x} cy={mouse.y} r={LENS_RADIUS} />
                </clipPath>
            </defs>

            {/* Zoomed map layer, clipped to circle */}
            <g clipPath={`url(#${CLIP_ID})`}>
                <g transform={`translate(${mouse.x}, ${mouse.y}) scale(${ZOOM}) translate(${-mouse.x}, ${-mouse.y})`}>
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

            {/* Visible lens border ring */}
            <circle
                cx={mouse.x}
                cy={mouse.y}
                r={LENS_RADIUS}
                className="lens-border"
            />
        </>
    );
}