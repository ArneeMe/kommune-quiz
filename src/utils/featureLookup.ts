// src/utils/featureLookup.ts
// Shared lookup utilities for kommune features.

import type { KommuneFeature } from "../types";

/** Build a Map from kommunenummer → KommuneFeature. */
export function buildFeatureMap(features: KommuneFeature[]): Map<string, KommuneFeature> {
    const map = new Map<string, KommuneFeature>();
    for (const f of features) map.set(f.properties.kommunenummer, f);
    return map;
}

/** Build a Map from lowercase kommune name → kommunenummer. */
export function buildNameLookup(features: KommuneFeature[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const f of features) map.set(f.properties.navn.toLowerCase(), f.properties.kommunenummer);
    return map;
}

/** Build a sorted array of kommune names (Norwegian locale). */
export function buildSortedNames(features: KommuneFeature[]): string[] {
    return features.map((f) => f.properties.navn).sort((a, b) => a.localeCompare(b, "no"));
}

/** No-op function for use as a default callback. */
export const noop = () => {};
