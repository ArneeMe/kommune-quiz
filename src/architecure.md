# Kommune Quiz — Architecture

## Overview
Interactive map quiz game where players identify Norwegian kommuner (municipalities) by clicking on them. Built with React + TypeScript + Vite, deployed to Cloudflare Pages.

## Data
- `src/data/kommuner.json` — TopoJSON file with 357 kommuner (from robhop/fylker-og-kommuner, CC BY 4.0)
- Each kommune has `kommunenummer` (unique ID) and `navn` (name)
- Projection is custom Mercator (see `src/utils/geo.ts`) because d3's `fitSize` doesn't work with this TopoJSON

## Project Structure
```
src/
├── types/
│   ├── geo.ts              # KommuneFeature, KommuneProperties, KommunePath
│   ├── game.ts             # GameMode, GameState
│   └── index.ts            # Barrel export
├── utils/
│   └── geo.ts              # Custom Mercator projection → SVG paths
├── hooks/
│   ├── useMapData.ts       # Loads TopoJSON → KommuneFeature[]
│   └── useGameState.ts     # Core game logic (shuffle, guess, skip, score)
├── components/
│   ├── map/
│   │   ├── GameMap.tsx      # SVG map container, mouse tracking
│   │   ├── KommuneShape.tsx # Single kommune <path> element
│   │   └── MagnifyingLens.tsx  # Zoomed circular lens overlay
│   └── ui/
│       ├── GameHeader.tsx   # Target name, progress, errors, skip
│       └── LensToggle.tsx   # Lens on/off button
├── styles/
│   └── index.css           # All styles (flat, no CSS modules yet)
├── App.tsx                  # Root orchestrator
└── main.tsx                 # Entry point
```

## Key Principles
- **Single source of data**: `useMapData` called once in `App`, features passed down as props
- **Game logic in hooks**: `useGameState` is the only place game state is managed
- **Presentational components**: Map and UI components receive data via props, no direct hook calls
- **AI-friendly files**: Each file is small, single-responsibility, and independently replaceable
- **Types first**: All shared interfaces defined in `src/types/` with barrel exports

## Data Flow
```
App
├── useMapData() → features
├── useGameState(features) → game state
│
├── GameHeader ← {currentName, currentIndex, total, errors, isComplete, onSkip}
├── LensToggle ← {enabled, onToggle}
└── GameMap ← {features, lensEnabled, solved, onGuess}
    ├── KommuneShape[] ← {d, kommunenummer, isSolved, onSelect}
    └── MagnifyingLens ← {mouse, paths, solved, onGuess}
```

## Wishlist (not yet implemented)
1. Choose fylke — play only one fylke at a time
2. Timer & restart — stopwatch + reset game
3. Toggle fylke names — show fylke labels as hints
4. Write mode — type kommune name instead of clicking