// src/App.tsx

import { useState } from "react";
import { GameMap } from "./components/GameMap";
import "./styles/index.css";

export default function App() {
    const [lensEnabled, setLensEnabled] = useState(false);

    return (
        <div className="app">
            <h1 className="app-title">Kommune Quiz</h1>
            <button
                className="lens-toggle"
                onClick={() => setLensEnabled((prev) => !prev)}
            >
                {lensEnabled ? "🔍 Lens On" : "🔍 Lens Off"}
            </button>
            <GameMap lensEnabled={lensEnabled} />
        </div>
    );
}