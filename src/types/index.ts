// src/types/index.ts

export interface KommuneProperties {
  kommunenummer: string;
  navn: string;
}

export interface KommuneFeature {
  type: "Feature";
  geometry: GeoJSON.Geometry;
  properties: KommuneProperties;
}