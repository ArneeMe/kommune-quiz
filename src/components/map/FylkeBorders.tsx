// src/components/map/FylkeBorders.tsx
// Renders internal fylke borders only (where two fylker meet).
// Uses topojson.mesh with a filter to exclude coastline/outer edges.

import { useMemo } from "react";
import { mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { GeoPermissibleObjects } from "d3-geo";
import rawFylker from "../../../data/fylker.json";

interface FylkeBordersProps {
    pathGenerator: (object: GeoPermissibleObjects) => string | null;
}

export function FylkeBorders({ pathGenerator }: FylkeBordersProps) {
    const borderPath = useMemo(() => {
        const topology = rawFylker as unknown as Topology;
        const layerName = Object.keys(topology.objects)[0];
        const object = topology.objects[layerName] as GeometryCollection;

        // mesh with filter: only arcs shared by two different fylker (internal borders)
        const borders = mesh(topology, object, (a, b) => a !== b);
        return pathGenerator(borders) ?? "";
    }, [pathGenerator]);

    if (!borderPath) return null;

    return (
        <g className="fylke-borders">
            <path d={borderPath} className="fylke-border" />
        </g>
    );
}