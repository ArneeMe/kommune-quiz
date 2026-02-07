// src/utils/geo.ts

import { geoTransform, geoPath } from "d3-geo";
import type { KommuneFeature } from "../types";

const WIDTH = 500;
const PADDING = 10;

function mercatorY(lat: number): number {
    return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
}

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

    return {
        pathGenerator: geoPath().projection(transform),
        viewBox: `0 0 ${WIDTH} ${Math.ceil(height)}`,
    };
}