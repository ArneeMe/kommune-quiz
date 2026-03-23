// src/utils/geoDistance.ts
// Geographic utilities for computing distance and direction between kommuner.

import type { KommuneFeature } from "../types";

interface Centroid {
    lon: number;
    lat: number;
}

/** Compute the centroid (average lon/lat) of a kommune's geometry. */
export function computeCentroid(feature: KommuneFeature): Centroid {
    const geom = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const coords = geom.type === "Polygon"
        ? geom.coordinates
        : geom.coordinates.flat();

    let totalLon = 0;
    let totalLat = 0;
    let count = 0;

    for (const ring of coords) {
        for (const [lon, lat] of ring) {
            totalLon += lon;
            totalLat += lat;
            count++;
        }
    }

    return { lon: totalLon / count, lat: totalLat / count };
}

/** Haversine distance in km between two points. */
export function haversineDistance(a: Centroid, b: Centroid): number {
    const R = 6371; // Earth radius in km
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lon - a.lon) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;

    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Bearing from point a to point b, in degrees (0 = north, 90 = east, etc.) */
export function bearing(a: Centroid, b: Centroid): number {
    const dLon = (b.lon - a.lon) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const deg = Math.atan2(y, x) * 180 / Math.PI;
    return (deg + 360) % 360;
}

/** Get a compass arrow emoji for a bearing. */
export function bearingToArrow(deg: number): string {
    if (!isFinite(deg)) return "⬆️";
    const arrows = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];
    const index = ((Math.round(deg / 45) % 8) + 8) % 8;
    return arrows[index];
}

/** Get distance and direction from guessed kommune to target kommune. */
export function getDistanceHint(
    guessedFeature: KommuneFeature,
    targetFeature: KommuneFeature,
): { distance: number; arrow: string } {
    const from = computeCentroid(guessedFeature);
    const to = computeCentroid(targetFeature);
    const dist = haversineDistance(from, to);
    const bear = bearing(from, to);
    return { distance: Math.round(dist), arrow: bearingToArrow(bear) };
}
