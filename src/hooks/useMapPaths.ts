// src/hooks/useMapPaths.ts
// Computes SVG paths and viewBox from features.
// Extracted from GameMap to keep components presentational.

import { useMemo } from "react";
import { createPathGenerator } from "../utils/geo";
import type { KommuneFeature, KommunePath } from "../types";

export function useMapPaths(allFeatures: KommuneFeature[], activeFeatures: KommuneFeature[]) {
    const { pathGenerator, computeViewBox } = useMemo(
        () => createPathGenerator(allFeatures),
        [allFeatures]
    );

    const viewBox = useMemo(
        () => computeViewBox(activeFeatures),
        [computeViewBox, activeFeatures]
    );

    const activeSet = useMemo(
        () => new Set(activeFeatures.map((f) => f.properties.kommunenummer)),
        [activeFeatures]
    );

    const allPaths: KommunePath[] = useMemo(() =>
            allFeatures
                .map((feature) => ({
                    d: pathGenerator(feature) ?? "",
                    kommunenummer: feature.properties.kommunenummer,
                }))
                .filter((p) => p.d),
        [allFeatures, pathGenerator]
    );

    const activePaths = useMemo(
        () => allPaths.filter((p) => activeSet.has(p.kommunenummer)),
        [allPaths, activeSet]
    );

    const isFiltered = activeFeatures.length < allFeatures.length;

    return { pathGenerator, viewBox, activeSet, allPaths, activePaths, isFiltered };
}