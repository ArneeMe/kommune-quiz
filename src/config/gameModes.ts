// src/config/gameModes.ts
// Game mode definitions. Add new modes here.

import type { GameModeInfo } from "../types";

export const GAME_MODES: GameModeInfo[] = [
    {
        mode: "map",
        label: "Kart",
        description: "Klikk på kommunen på kartet",
        icon: "🗺️",
    },
    {
        mode: "shield",
        label: "Våpen",
        description: "Gjett kommunen ut fra kommunevåpenet",
        icon: "🛡️",
    },
    {
        mode: "name",
        label: "Skriv",
        description: "Skriv navnet på kommunen",
        icon: "⌨️",
    },
    {
        mode: "reverse",
        label: "Omvendt",
        description: "Se kommunen på kartet, skriv navnet",
        icon: "🔄",
    },
];

export const DEFAULT_MODE = "map" as const;