// src/types/game.ts
// Types for game modes and shared quiz state

export type GameMode = "map" | "shield" | "reverse";

export interface GameModeInfo {
  mode: GameMode;
  label: string;
  description: string;
  icon: string;
}

/** Shared quiz state — mode-agnostic */
export interface QuizState {
  currentTarget: string | null;
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