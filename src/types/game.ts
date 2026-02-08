// src/types/game.ts
// Types for game state and configuration

/** Which game mode is active */
export type GameMode = "click"; // Future: "type"

/** Return value from useGameState hook */
export interface GameState {
  currentName: string;
  currentFylke: string;
  currentIndex: number;
  errors: number;
  total: number;
  isComplete: boolean;
  solved: Set<string>;
  handleGuess: (kommunenummer: string) => void;
  handleSkip: () => void;
}