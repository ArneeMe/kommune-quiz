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
│   ├── useGameState.ts     # Core game logic (shuffle, guess, skip, score, restart, auto-reset)
│   └── useTimer.ts         # Stopwatch hook (elapsed seconds, reset, formatTime)
├── components/
│   ├── Game.tsx            # DEAD CODE — alternative architecture, not used by App.tsx
│   ├── map/
│   │   ├── GameMap.tsx      # SVG map container, renders all kommuner, viewBox zoom, mouse tracking
│   │   ├── KommuneShape.tsx # Single kommune <path> element (solved/inactive states)
│   │   ├── MagnifyingLens.tsx  # Zoomed circular lens overlay
│   │   └── FylkeBorders.tsx # Internal fylke border lines (always visible)
│   └── ui/
│       ├── GameHeader.tsx   # Target name + shield, fylke hint, progress bar, errors, timer, skip, restart
│       ├── KommuneShield.tsx # Kommune coat of arms image (graceful fallback)
│       ├── LensToggle.tsx   # Generic toggle button (used for lens + fylke hint)
│       └── FylkeSelector.tsx # Dropdown: "Hele Norge" or specific fylke
├── styles/
│   └── index.css           # All styles (CSS custom properties, "Nordic Cartographer" dark theme)
├── App.tsx                  # Root orchestrator
└── main.tsx                 # Entry point
```

## Key Principles
- **Single source of data**: `useMapData` called once in `App`, features passed down as props
- **Game logic in hooks**: `useGameState` is the only place game state is managed
- **Presentational components**: Map and UI components receive data via props, no direct hook calls
- **AI-friendly files**: Each file is small, single-responsibility, and independently replaceable
- **Types first**: All shared interfaces defined in `src/types/` with barrel exports
- **CSS custom properties**: All colors/values defined as `:root` variables for consistency

## Data Flow
```
App
├── useMapData() → features (all 357 kommuner)
├── selectedFylke state → filters features into activeFeatures
├── useGameState(activeFeatures) → game state (auto-resets when features change)
├── useTimer(!isComplete) → elapsed seconds
│
├── GameHeader ← {currentName, currentFylke, currentKommunenummer, showFylke, currentIndex, total, errors, elapsed, isComplete, onSkip, onRestart}
│   └── KommuneShield ← {kommunenummer} (coat of arms)
├── Toolbar
│   ├── FylkeSelector ← {fylker, selected, onChange}
│   ├── LensToggle (lens on/off)
│   └── LensToggle (fylke hint on/off)
└── GameMap ← {allFeatures, activeFeatures, lensEnabled, solved, onGuess}
    ├── KommuneShape[] ← {d, kommunenummer, isSolved, isInactive, onSelect}
    ├── FylkeBorders ← {pathGenerator} (always visible, internal borders only)
    └── MagnifyingLens ← {mouse, paths, solved, onGuess} (active kommuner only)
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
- ✅ Progress bar (visual completion indicator)
- ✅ Kommune coat of arms (kommunevåpen) displayed next to target name

## Wishlist
1. Write mode — type kommune name instead of clicking (autocomplete input)
2. Score persistence — localStorage best times per fylke
3. Mobile support — touch handling, responsive layout
4. Accessibility — keyboard navigation, ARIA labels