// src/components/map/ArrowHint.tsx
// Animated directional arrow hint drawn on the SVG map.
// Points from the last wrong guess toward the target kommune.

interface ArrowHintProps {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}

export function ArrowHint({ fromX, fromY, toX, toY }: ArrowHintProps) {
    // Compute direction vector
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return null;

    // Normalize
    const nx = dx / len;
    const ny = dy / len;

    // Arrow starts from the "from" point and extends partway (60%) toward target
    const arrowLen = len * 0.6;
    const endX = fromX + nx * arrowLen;
    const endY = fromY + ny * arrowLen;

    // Arrowhead size scales with the viewbox
    const headSize = Math.max(8, Math.min(20, len * 0.08));

    // Arrowhead points
    const perpX = -ny;
    const perpY = nx;
    const tipX = endX + nx * headSize;
    const tipY = endY + ny * headSize;
    const leftX = endX + perpX * headSize * 0.5;
    const leftY = endY + perpY * headSize * 0.5;
    const rightX = endX - perpX * headSize * 0.5;
    const rightY = endY - perpY * headSize * 0.5;

    return (
        <g className="arrow-hint" pointerEvents="none">
            {/* Arrow line */}
            <line
                x1={fromX}
                y1={fromY}
                x2={endX}
                y2={endY}
                stroke="var(--color-orange)"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.8}
                className="arrow-hint-line"
            />
            {/* Arrowhead */}
            <polygon
                points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
                fill="var(--color-orange)"
                opacity={0.9}
                className="arrow-hint-head"
            />
            {/* Pulsing circle at origin */}
            <circle
                cx={fromX}
                cy={fromY}
                r={headSize * 0.4}
                fill="var(--color-orange)"
                opacity={0.6}
                className="arrow-hint-origin"
            />
        </g>
    );
}
