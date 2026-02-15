# Kommune Quiz — Architecture

## Overview
Interactive map quiz with three game modes for identifying Norwegian kommuner. React + TypeScript + Vite, Cloudflare Pages.

## Data
- `src/data/kommuner.json` — 357 kommuner TopoJSON (from robhop/fylker-og-kommuner, CC BY 4.0)
- `src/data/fylker.json` — 15 fylker TopoJSON
- `public/shields/{kommunenummer}.png` — coat of arms from Wikidata
- Custom Mercator projection in `src/utils/geo.ts`

## Project Structure
```
src/
├── types/                   # GameMode, QuizState, KommuneFeature, KommunePath
├── config/gameModes.ts      # Mode definitions (map, shield, reverse)
├── utils/geo.ts             # Projection + viewBox
├── hooks/
│   ├── useQuizState.ts      # Shared quiz state machine
│   ├── useMapData.ts        # TopoJSON → features
│   ├── useMapPaths.ts       # Features → SVG paths + viewBox
│   └── useTimer.ts          # Stopwatch
├── modes/
│   ├── map/                 # useMapGame + MapGame (click-to-guess)
│   ├── shield/              # useShieldGame + ShieldGame (shield → type name)
│   └── reverse/             # useReverseGame + ReverseGame (highlight → type name)
├── components/
│   ├── map/                 # GameMap, KommuneShape, MagnifyingLens, FylkeBorders
│   └── ui/                  # CommandBar, CompletionOverlay, ModeSelector, NameInput, KommuneShield
├── styles/                  # base, command-bar, map, modes, completion
└── App.tsx                  # Root — mode switching, shared state
```

## Game Modes
| Mode | Prompt | Input | Map |
|------|--------|-------|-----|
| Kart | Name + shield | Click map | Interactive |
| Våpen | Large shield | Type name | Hidden |
| Omvendt | Highlighted kommune | Type name | Passive |

## Data Flow
```
App
├── useMapData() → features
├── gameMode / selectedFylke → activeFeatures
├── useMapGame / useShieldGame / useReverseGame (all run, one active)
├── useTimer(!activeQuiz.isComplete)
│
├── CommandBar ← {mode, stats, tools (conditional per mode)}
├── map-container
│   ├── MapGame | ShieldGame | ReverseGame
│   └── CompletionOverlay
```

## Key Principles
- **useQuizState** is the shared state machine — modes wrap it with guess validation
- **One folder per mode** — hook + component, independently addable/deletable
- **Components are presentational** — hooks own all logic
- **CSS custom properties** in `base.css`, split across 5 files

## Features
- ✅ Three game modes with mode selector
- ✅ Autocomplete name input, guess feedback
- ✅ Highlighted kommune (reverse), magnifying lens (map)
- ✅ Fylke selector, fylke hint, fylke borders, skip, timer, restart
- ✅ Progress bar, completion overlay, kommune coat of arms

## Wishlist
1. Score persistence — localStorage best times per fylke per mode
2. Mobile support — touch handling, responsive layout
3. Accessibility — keyboard navigation, ARIA labels