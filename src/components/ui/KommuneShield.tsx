// src/components/ui/KommuneShield.tsx
// Displays the kommune coat of arms (kommunevåpen) as a small image.
// Gracefully hides if the image doesn't exist.

import { useState } from "react";

interface KommuneShieldProps {
    kommunenummer: string;
    size?: number;
}

export function KommuneShield({ kommunenummer, size = 28 }: KommuneShieldProps) {
    const [hidden, setHidden] = useState(false);

    if (hidden) return null;

    return (
        <img
            src={`/shields/${kommunenummer}.png`}
            alt=""
            width={size}
            height={size}
            className="kommune-shield"
            onError={() => setHidden(true)}
        />
    );
}