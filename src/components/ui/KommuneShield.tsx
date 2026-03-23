// src/components/ui/KommuneShield.tsx
// Displays the kommune coat of arms (kommunevåpen) as a small image.
// Gracefully hides if the image doesn't exist.

import { useState } from "react";

/** Only allow digits in kommunenummer to prevent path traversal. */
const SAFE_KOMMUNENUMMER = /^\d+$/;

interface KommuneShieldProps {
    kommunenummer: string;
    size?: number;
}

export function KommuneShield({ kommunenummer, size = 28 }: KommuneShieldProps) {
    const [hidden, setHidden] = useState(false);

    if (hidden || !SAFE_KOMMUNENUMMER.test(kommunenummer)) return null;

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