# Kommune Quiz

Interactive map quiz for Norwegian municipalities (kommuner). Three game modes plus a daily 5-question challenge.

Live: <https://kommune-quiz.pages.dev> · Stack: React 19 + TypeScript + Vite + d3-geo, deployed on Cloudflare Pages.

## Game Modes

| Mode | Prompt | Input | Description |
|------|--------|-------|-------------|
| **Kart** | Kommune name + small shield | Click the map | Find the municipality on Norway. |
| **Våpen** | Large coat of arms | Type the name | Identify the kommune from its shield. |
| **Omvendt** | Highlighted kommune on map | Type the name | Name the highlighted region. |
| **Dagens** | 5 mixed questions | Mode-dependent | One run per day, shareable result. |

Progressive hints after wrong guesses: distance + direction arrows (Kart), area + revealed letters (Våpen), first-letters prefix (Omvendt).

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + vite build
npm run lint      # eslint
```

Node ≥ 20 recommended.

## Regenerating data

```bash
node scripts/prepare-data.mjs       # rebuilds data/kommuner.json from upstream
node scripts/download-shields.mjs   # fetches missing shields from Wikidata
```

## Deploy

Deployment runs on Cloudflare Pages (see `wrangler.json`). The `dist/` directory is published as an SPA with not-found fallback to `index.html`.

```bash
npm run build
npx wrangler pages deploy dist
```

## Project layout

- `src/modes/` — one folder per game mode (hook + component)
- `src/hooks/` — shared state, map data, zoom, timer, theme
- `src/components/map/` — SVG map primitives
- `src/components/ui/` — shared UI (command bar, name input, hint bar, …)
- `src/utils/` — projection, distance/area math, daily-challenge generator
- `src/styles/` — split CSS, imported via `index.css`
- `data/` — TopoJSON for kommuner and fylker
- `public/shields/` — coat-of-arms PNGs keyed by kommunenummer
- `scripts/` — data-prep scripts (Node ESM)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details and [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting changes.

## Credits & licenses

- Kommune and fylke geometries: [robhop/fylker-og-kommuner](https://github.com/robhop/fylker-og-kommuner), CC BY 4.0.
- Coat-of-arms images: Wikidata / Wikimedia Commons (per-shield licenses).
- Code: see repository.
