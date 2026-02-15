// src/config/gameModes.ts
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
        mode: "reverse",
        label: "Omvendt",
        description: "Se kommunen på kartet, skriv navnet",
        icon: "🔄",
    },
];

export const DEFAULT_MODE = "map" as const;