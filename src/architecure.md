# Kommune Quiz — Architecture

## Overview
Interactive map quiz game where players identify Norwegian kommuner (municipalities) by clicking on them. Built with React + TypeScript + Vite, deployed to Cloudflare Pages.

## Data
- `src/data/kommuner.json` — TopoJSON with 357 kommuner, enriched with fylke info (from robhop/fylker-og-kommuner, CC BY 4.0)
- `src/data/fylker.json` — TopoJSON with 15 fylker boundaries (used for internal border rendering)
- `public/shields/{kommunenummer}.png` — Coat of arms images downloaded from Wikidata (via `scripts/download-shields.mjs`)
- Each kommune has `kommunenummer`, `navn`, `fylkesnummer`, `fylkenavn`
- Run `node scripts/prepare-data.mjs` to regenerate data files
- Run `node scripts/download-shields.mjs` to download coat of arms images
- Projection is custom Mercator (see `src/utils/geo.ts`) because d3's `fitSize` doesn't work with this TopoJSON

## Project Structure
```
src/
├── types/
│   ├── geo.ts              # KommuneFeature, KommuneProperties, KommunePath
│   ├── game.ts             # GameMode, GameState
│   └── index.ts            # Barrel export
├── utils/
│   └── geo.ts              # Custom Mercator projection → SVG paths + viewBox zoom
├── hooks/
│   ├── useMapData.ts       # Loads TopoJSON → KommuneFeature[]
│   ├── useMapPaths.ts      # Computes SVG paths, viewBox, activeSet from features
│   ├── useGameState.ts     # Core game logic (shuffle, guess, skip, score, restart, auto-reset)
│   └── useTimer.ts         # Stopwatch hook (elapsed seconds, reset, formatTime)
├── components/
│   ├── map/
│   │   ├── GameMap.tsx      # SVG map container, renders all kommuner, mouse tracking
│   │   ├── KommuneShape.tsx # Single kommune <path> element (solved/inactive states)
│   │   ├── MagnifyingLens.tsx  # Zoomed circular lens overlay
│   │   └── FylkeBorders.tsx # Internal fylke border lines (always visible)
│   └── ui/
│       ├── CommandBar.tsx   # Unified bar: region selector, target, stats, tools, actions
│       ├── CompletionOverlay.tsx # Animated overlay with stats and replay
│       └── KommuneShield.tsx # Kommune coat of arms image (graceful fallback)
├── styles/
│   ├── index.css           # Imports all style files
│   ├── base.css            # Reset, CSS variables, body, aurora, app shell
│   ├── command-bar.css     # CommandBar styles
│   ├── map.css             # Kommune shapes, fylke borders, lens, markers
│   └── completion.css      # Completion overlay and card
├── App.tsx                  # Root orchestrator
└── main.tsx                 # Entry point
```

## Key Principles
- **Single source of data**: `useMapData` called once in `App`, features passed down as props
- **Game logic in hooks**: `useGameState` is the only place game state is managed
- **Path computation in hooks**: `useMapPaths` owns all SVG path/viewBox logic
- **Presentational components**: Map and UI components receive data via props, no direct hook calls
- **AI-friendly files**: Each file is small, single-responsibility, and independently replaceable
- **Types first**: All shared interfaces defined in `src/types/` with barrel exports
- **CSS custom properties**: All colors/values defined as `:root` variables in `base.css`

## Data Flow
```
App
├── useMapData() → features (all 357 kommuner)
├── selectedFylke state → filters features into activeFeatures
├── useGameState(activeFeatures) → game state (auto-resets when features change)
├── useTimer(!isComplete) → elapsed seconds
│
├── CommandBar ← {target info, stats, fylker, toggles, actions}
│   └── KommuneShield ← {kommunenummer}
├── map-container
│   ├── GameMap ← {allFeatures, activeFeatures, lensEnabled, solved, onGuess}
│   │   ├── useMapPaths(allFeatures, activeFeatures) → paths, viewBox, activeSet
│   │   ├── KommuneShape[] ← {d, kommunenummer, isSolved, isInactive, onSelect}
│   │   ├── FylkeBorders ← {pathGenerator}
│   │   └── MagnifyingLens ← {mouse, paths, solved, onGuess}
│   └── CompletionOverlay ← {errors, elapsed, onRestart}
```

## Features
- ✅ Click-to-guess game loop with 357 kommuner
- ✅ Magnifying lens (toggleable, 3x zoom)
- ✅ Fylke hint toggle (shows fylke name next to target)
- ✅ Fylke borders (always visible, internal only via topojson mesh)
- ✅ Skip button (adds kommune back to end of queue)
- ✅ Timer (mm:ss, stops on completion)
- ✅ Restart (reshuffles, resets everything)
- ✅ Fylke selector (play one fylke at a time, map zooms to fit, inactive kommuner dimmed)
- ✅ Progress bar (gradient with glow)
- ✅ Kommune coat of arms (kommunevåpen) displayed next to target name
- ✅ Completion overlay (animated card with stats and replay)

## Wishlist
1. Write mode — type kommune name instead of clicking (autocomplete input)
2. Score persistence — localStorage best times per fylke
3. Mobile support — touch handling, responsive layout
4. Accessibility — keyboard navigation, ARIA labels