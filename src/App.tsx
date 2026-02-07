// src/App.tsx

import { GameMap } from "./components/GameMap";
import "./styles/index.css";

export default function App() {
  return (
    <div className="app">
      <h1 className="app-title">Kommune Quiz</h1>
      <GameMap />
    </div>
  );
}
