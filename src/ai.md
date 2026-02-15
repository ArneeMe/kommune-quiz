# Kommune Quiz — AI Context Document

## What This Is

Interactive map quiz game — identify Norwegian kommuner (municipalities). Three game modes: click on map, guess from coat of arms, or identify a highlighted kommune. React + TypeScript + Vite, deployed to Cloudflare Pages.

## Tech Stack

- **React 19** with React Compiler (auto-memoization)
- **TypeScript** (strict), **Vite**, **d3-geo**, **topojson-client**
- Plain CSS with custom properties, dark theme ("Arctic Observatory")

## Coding Conventions

- **Norwegian UI text**, **English code** (except domain terms: `kommune`, `fylke`, `kommunenummer`, etc.)
- **Small files** (<100 lines), single-responsibility, AI-replaceable
- **Types first** in `src/types/`, hooks for logic, components are presentational
- **CSS**: split across 5 files in `src/styles/`, imported via `index.css`

## Data

- `src/data/kommuner.json` — 357 kommuner TopoJSON (`{kommunenummer, navn, fylkesnummer, fylkenavn}`)
- `src/data/fylker.json` — 15 fylker TopoJSON
- `public/shields/{kommunenummer}.png` — coat of arms from Wikidata
- `kommunenummer` first 2 digits = `fylkesnummer`
- Regenerate: `node scripts/prepare-data.mjs` / `node scripts/download-shields.mjs`

## Project Structure

```
src/
├── types/
│   ├── geo.ts              # KommuneFeature, KommuneProperties, KommunePath
│   ├── game.ts             # GameMode, GameModeInfo, QuizState
│   └── index.ts            # Barrel export
├── config/
│   └── gameModes.ts        # Mode definitions (map, shield, reverse)
├── utils/
│   └── geo.ts              # Custom Mercator projection + viewBox
├── hooks/
│   ├── useMapData.ts       # Loads TopoJSON → KommuneFeature[]
│   ├── useMapPaths.ts      # SVG paths, viewBox, activeSet from features
│   ├── useQuizState.ts     # Shared quiz state machine (mode-agnostic)
│   ├── useGameState.ts     # DEPRECATED — re-exports from modes/map/useMapGame
│   └── useTimer.ts         # Stopwatch (elapsed, reset, formatTime)
├── modes/
│   ├── map/
│   │   ├── useMapGame.ts   # Click-to-guess validation wrapping useQuizState
│   │   └── MapGame.tsx     # Interactive map with lens
│   ├── shield/
│   │   ├── useShieldGame.ts # Name-string matching wrapping useQuizState
│   │   └── ShieldGame.tsx  # Large shield image + text input + feedback
│   └── reverse/
│       ├── useReverseGame.ts # Name-string matching + highlighted target
│       └── ReverseGame.tsx # Passive map with highlight + floating input + feedback
├── components/
│   ├── map/
│   │   ├── GameMap.tsx     # SVG container, renders kommuner, mouse tracking, lens
│   │   ├── KommuneShape.tsx # Single <path> (solved/inactive/highlighted states)
│   │   ├── MagnifyingLens.tsx
│   │   └── FylkeBorders.tsx
│   └── ui/
│       ├── CommandBar.tsx  # Unified bar: mode selector, region, target, stats, tools
│       ├── CompletionOverlay.tsx # Animated overlay with stats and replay
│       ├── KommuneShield.tsx # Coat of arms image (graceful fallback)
│       ├── ModeSelector.tsx # Segmented mode button group
│       └── NameInput.tsx   # Autocomplete text input (shared by shield + reverse)
├── styles/
│   ├── index.css           # Imports all style files
│   ├── base.css            # Variables, reset, aurora, app shell
│   ├── command-bar.css     # CommandBar + ModeSelector
│   ├── map.css             # Kommune shapes, borders, lens, markers
│   ├── modes.css           # NameInput, shield game, reverse overlay, feedback, highlighted
│   └── completion.css      # Completion overlay
├── App.tsx                 # Root orchestrator — mode switching
└── main.tsx
```

## Game Modes

| Mode | Prompt | Input | Map | Name shown | Shield shown |
|------|--------|-------|-----|------------|-------------|
| **Kart** | Name + small shield | Click map | Interactive | ✅ | ✅ Small |
| **Våpen** | Large shield | Type name | Not shown | ❌ | ✅ Large |
| **Omvendt** | Highlighted kommune | Type name | Passive | ❌ | ❌ |

## Architecture

**Shared state**: `useQuizState` — shuffled order, progress, errors, skip, restart. Mode-agnostic. Exposes `markSolved(kommunenummer)` and `markError()`.

**Per-mode hooks** wrap `useQuizState` with mode-specific guess validation:
- `useMapGame` — validates by kommunenummer (click)
- `useShieldGame` — validates by name string (type)
- `useReverseGame` — validates by name string + exposes `highlightedKommune`

**App** runs all three hooks (state persists across mode switches), renders the active mode's component. Resets all on mode change.

**CommandBar** conditionally shows/hides elements per mode (`showTarget`, `showLensToggle`, `showFylkeHintToggle`).

## Data Flow

```
App
├── useMapData() → features
├── gameMode state
├── selectedFylke → activeFeatures
├── useMapGame(activeFeatures)
├── useShieldGame(activeFeatures)
├── useReverseGame(activeFeatures)
├── activeQuiz = pick by gameMode
├── useTimer(!activeQuiz.isComplete)
│
├── CommandBar ← {mode, target info (conditional), stats, tools}
│   ├── ModeSelector
│   └── KommuneShield (map mode only)
├── map-container
│   ├── MapGame | ShieldGame | ReverseGame (switched by mode)
│   └── CompletionOverlay (conditional)
```

## Key Details

- **Projection** (`utils/geo.ts`): custom Mercator, always based on ALL features. Zoom via SVG viewBox.
- **useMapPaths**: extracted path/viewBox computation from GameMap
- **KommuneShape**: supports `isHighlighted` for reverse mode (golden pulsing fill)
- **NameInput**: autocomplete with keyboard nav (↑↓ Enter Esc), shared by shield + reverse
- **Feedback**: shield + reverse show ✓/✗ below input, resets on target change
- **FylkeBorders**: `mesh` with `(a, b) => a !== b` for internal borders only

## CSS Theme — "Arctic Observatory"

Fonts: Instrument Serif (display) + Geist (body) + Geist Mono. Glass-morphism panels, aurora background, gradient progress bar. Key variables in `base.css`.

## Features

- ✅ Three game modes (kart, våpen, omvendt)
- ✅ Mode selector with reset on switch
- ✅ Autocomplete name input with keyboard navigation
- ✅ Highlighted kommune (reverse mode, golden pulse)
- ✅ Guess feedback (correct/wrong, no answer reveal)
- ✅ Magnifying lens, fylke hint, fylke borders
- ✅ Fylke selector, skip, timer, restart, progress bar
- ✅ Completion overlay, kommune coat of arms

## Wishlist

1. Score persistence — localStorage best times per fylke per mode
2. Mobile support — touch handling, responsive layout
3. Accessibility — keyboard navigation, ARIA labels