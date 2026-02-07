// src/components/GameMap.tsx

import { useMemo, useCallback } from "react";
import { useMapData } from "../hooks/useMapData";
import { createPathGenerator } from "../utils/geo";
import { KommuneShape } from "./KommuneShape";

export function GameMap() {
    const { features } = useMapData();

    const { pathGenerator, viewBox } = useMemo(
        () => createPathGenerator(features),
        [features]
    );

    const featureMap = useMemo(
        () => new Map(features.map((f) => [f.properties.kommunenummer, f.properties.navn])),
        [features]
    );

    const handleSelect = useCallback((kommunenummer: string) => {
        console.log(`Selected: ${kommunenummer} - ${featureMap.get(kommunenummer)}`);
    }, [featureMap]);

    return (
        <svg
            viewBox={viewBox}
            className="game-map"
        >
            {features.map((feature) => {
                const d = pathGenerator(feature);
                if (!d) return null;

                return (
                    <KommuneShape
                        key={feature.properties.kommunenummer}
                        d={d}
                        kommunenummer={feature.properties.kommunenummer}
                        onSelect={handleSelect}
                    />
                );
            })}
        </svg>
    );
}