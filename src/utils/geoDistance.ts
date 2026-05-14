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

const MAX_NORWAY_DISTANCE = 2000;

export function computeProximity(distanceKm: number): number {
    return Math.max(0, Math.round((1 - distanceKm / MAX_NORWAY_DISTANCE) * 100));
}

// Spherical area of a single ring in steradians, independent of winding.
// We can't rely on d3.geoArea here because our TopoJSON-derived polygons
// have inconsistent ring orientations, which makes the signed sum useless.
const DEG = Math.PI / 180;
function ringSteradians(ring: GeoJSON.Position[]): number {
    let s = 0;
    for (let i = 0, n = ring.length - 1; i < n; i++) {
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[i + 1];
        s += (lon2 - lon1) * DEG * (2 + Math.sin(lat1 * DEG) + Math.sin(lat2 * DEG));
    }
    return Math.abs(s / 2);
}

function polygonSteradians(rings: GeoJSON.Position[][]): number {
    if (!rings.length) return 0;
    const outer = ringSteradians(rings[0]);
    let holes = 0;
    for (let i = 1; i < rings.length; i++) holes += ringSteradians(rings[i]);
    return Math.max(0, outer - holes);
}

/** Spherical area of a kommune in km² (rounded). */
export function computeAreaKm2(feature: KommuneFeature): number {
    const R = 6371; // Earth radius in km
    const geom = feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    let steradians = 0;
    if (geom.type === "Polygon") {
        steradians = polygonSteradians(geom.coordinates);
    } else if (geom.type === "MultiPolygon") {
        for (const poly of geom.coordinates) steradians += polygonSteradians(poly);
    }
    return Math.round(steradians * R * R);
}

/** Get distance and direction from guessed kommune to target kommune. */
export function getDistanceHint(
    guessedFeature: KommuneFeature,
    targetFeature: KommuneFeature,
): { distance: number; arrow: string; proximity: number } {
    const from = computeCentroid(guessedFeature);
    const to = computeCentroid(targetFeature);
    const dist = haversineDistance(from, to);
    const bear = bearing(from, to);
    const rounded = Math.round(dist);
    return { distance: rounded, arrow: bearingToArrow(bear), proximity: computeProximity(rounded) };
}
