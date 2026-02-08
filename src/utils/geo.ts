// src/utils/geo.ts
// Custom Mercator projection that bypasses d3's fitSize issues with our TopoJSON.
// Manually projects lon/lat → Mercator → SVG coordinates.

import { geoTransform, geoPath } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import type { KommuneFeature } from "../types";

const WIDTH = 1200;
const PADDING = 10;

function mercatorY(lat: number): number {
    return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
}

/**
 * Creates a path generator and viewBox computation based on ALL features.
 * The projection is always based on the full set of features (full Norway).
 * Use computeViewBox(subset) to zoom the SVG to any subset.
 */
export function createPathGenerator(features: KommuneFeature[]) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const f of features) {
        const geom = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
        const coords = geom.type === "Polygon"
            ? geom.coordinates
            : geom.coordinates.flat();

        for (const ring of coords) {
            for (const [lon, lat] of ring) {
                const x = lon * Math.PI / 180;
                const y = mercatorY(lat);
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    const rawW = maxX - minX;
    const rawH = maxY - minY;
    const usableWidth = WIDTH - PADDING * 2;
    const scale = usableWidth / rawW;
    const height = rawH * scale + PADDING * 2;

    const transform = geoTransform({
        point(lon, lat) {
            const x = (lon * Math.PI / 180 - minX) * scale + PADDING;
            const y = (maxY - mercatorY(lat)) * scale + PADDING;
            this.stream.point(x, y);
        },
    });

    const pathGenerator = geoPath().projection(transform);

    const fullViewBox = `0 0 ${WIDTH} ${Math.ceil(height)}`;

    /**
     * Compute a viewBox that zooms to a subset of features.
     * Uses the same projection (coordinate space) as the full map.
     */
    function computeViewBox(subsetFeatures: KommuneFeature[]): string {
        if (subsetFeatures.length === features.length) {
            return fullViewBox;
        }

        let sMinX = Infinity;
        let sMinY = Infinity;
        let sMaxX = -Infinity;
        let sMaxY = -Infinity;

        for (const f of subsetFeatures) {
            const geom = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
            const coords = geom.type === "Polygon"
                ? geom.coordinates
                : geom.coordinates.flat();

            for (const ring of coords) {
                for (const [lon, lat] of ring) {
                    const sx = (lon * Math.PI / 180 - minX) * scale + PADDING;
                    const sy = (maxY - mercatorY(lat)) * scale + PADDING;
                    if (sx < sMinX) sMinX = sx;
                    if (sx > sMaxX) sMaxX = sx;
                    if (sy < sMinY) sMinY = sy;
                    if (sy > sMaxY) sMaxY = sy;
                }
            }
        }

        const pad = 15;
        const vx = Math.max(0, sMinX - pad);
        const vy = Math.max(0, sMinY - pad);
        const vw = sMaxX - sMinX + pad * 2;
        const vh = sMaxY - sMinY + pad * 2;

        return `${vx} ${vy} ${vw} ${vh}`;
    }

    return {
        pathGenerator: pathGenerator as (object: GeoPermissibleObjects) => string | null,
        computeViewBox,
        viewBox: fullViewBox,
    };
}