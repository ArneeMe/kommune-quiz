// src/types/geo.ts
// Types for geographic/map data structures

export interface KommuneProperties {
    kommunenummer: string;
    navn: string;
}

export interface KommuneFeature {
    type: "Feature";
    geometry: GeoJSON.Geometry;
    properties: KommuneProperties;
}

/** Pre-computed path data for rendering a kommune on the SVG map */
export interface KommunePath {
    d: string;
    kommunenummer: string;
}