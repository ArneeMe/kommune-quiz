# Kommune Quiz — Architecture

## Overview
Interactive map quiz game where players identify Norwegian kommuner (municipalities) by clicking on them. Built with React + TypeScript + Vite, deployed to Cloudflare Pages.

## Data
- `src/data/kommuner.json` — TopoJSON with 357 kommuner, enriched with fylke info (from robhop/fylker-og-kommuner, CC BY 4.0)
- `src/data/fylker.json` — TopoJSON with 15 fylker boundaries (used for internal border rendering)
- Each kommune has `kommunenummer`, `navn`, `fylkesnummer`, `fylkenavn`
- Run `node scripts/prepare-data.mjs` to regenerate both files
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
│   ├── useGameState.ts     # Core game logic (shuffle, guess, skip, score, restart)
│   └── useTimer.ts         # Stopwatch hook (elapsed seconds, reset)
├── components/
│   ├── map/
│   │   ├── GameMap.tsx      # SVG map container, mouse tracking
│   │   ├── KommuneShape.tsx # Single kommune <path> element
│   │   ├── MagnifyingLens.tsx  # Zoomed circular lens overlay
│   │   └── FylkeBorders.tsx # Internal fylke border lines (always visible)
│   └── ui/
│       ├── GameHeader.tsx   # Target name, fylke hint, progress, errors, timer, skip, restart
│       └── LensToggle.tsx   # Generic toggle button (used for lens + fylke hint)
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
├── useGameState(features) → game state (name, fylke, score, errors, solved, restart)
├── useTimer(!isComplete) → elapsed seconds
│
├── GameHeader ← {currentName, currentFylke, showFylke, currentIndex, total, errors, elapsed, isComplete, onSkip, onRestart}
├── Toolbar
│   ├── LensToggle (lens on/off)
│   └── LensToggle (fylke hint on/off)
└── GameMap ← {features, lensEnabled, solved, onGuess}
    ├── KommuneShape[] ← {d, kommunenummer, isSolved, onSelect}
    ├── FylkeBorders ← {pathGenerator} (always visible, internal borders only)
    └── MagnifyingLens ← {mouse, paths, solved, onGuess}
```

## Features
- ✅ Click-to-guess game loop with 357 kommuner
- ✅ Magnifying lens (toggleable, 3x zoom)
- ✅ Fylke hint toggle (shows fylke name next to target)
- ✅ Fylke borders (always visible, internal only via topojson mesh)
- ✅ Skip button (adds kommune back to end of queue)
- ✅ Timer (mm:ss, stops on completion)
- ✅ Restart (reshuffles, resets everything)

## Wishlist
1. Choose fylke — play only one fylke at a time (map re-renders to show just that fylke)
2. Write mode — type kommune name instead of clicking