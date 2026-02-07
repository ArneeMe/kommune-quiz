// src/hooks/useMapData.ts

import { useMemo } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { KommuneFeature } from "../types";
import rawTopology from "../data/kommuner.json";

export function useMapData() {
  const features = useMemo(() => {
    const topology = rawTopology as unknown as Topology;
    const layerName = Object.keys(topology.objects)[0];
    const collection = feature(topology, topology.objects[layerName]);
    return (collection as unknown as GeoJSON.FeatureCollection).features as KommuneFeature[];
  }, []);

  return { features };
}