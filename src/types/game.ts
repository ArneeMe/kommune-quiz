// src/types/game.ts
// Types for game modes and shared quiz state

/** Available game modes */
export type GameMode = "map" | "shield" | "name" | "reverse";

/** Game mode metadata for the mode selector */
export interface GameModeInfo {
  mode: GameMode;
  label: string;        // Norwegian display name
  description: string;  // Norwegian short description
  icon: string;         // emoji or symbol
}

/** Shared quiz state returned by useQuizState — mode-agnostic */
export interface QuizState {
  currentTarget: string | null;       // kommunenummer of current target
  currentName: string;
  currentFylke: string;
  currentKommunenummer: string;
  currentIndex: number;
  errors: number;
  total: number;
  isComplete: boolean;
  solved: Set<string>;
  markSolved: (kommunenummer: string) => void;
  markError: () => void;
  handleSkip: () => void;
  handleRestart: () => void;
}

/** Full game state for map mode (extends quiz with map-specific guess) */
export interface MapGameState extends QuizState {
  handleGuess: (kommunenummer: string) => void;
}