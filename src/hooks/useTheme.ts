// src/hooks/useTheme.ts
// Light/dark theme toggle with localStorage persistence.

import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "kommune-quiz-theme";

function getInitialTheme(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "dark" || stored === "light") return stored;
    } catch {}
    return "dark";
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    }, []);

    return { theme, toggleTheme };
}
