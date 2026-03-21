// src/types/game.ts
export type GameMode = "map" | "shield" | "reverse";

export interface GameModeInfo {
  mode: GameMode;
  label: string;
  description: string;
  icon: string;
}

export interface DailyQuestion {
  kommunenummer: string;
  mode: GameMode;
}

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
  handleGiveUp: () => void;
  handleRestart: () => void;
}