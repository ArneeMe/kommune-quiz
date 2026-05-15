# Contributing

Thanks for considering a change. This project is small on purpose — easy to read end-to-end, easy for AI agents to extend. Please keep it that way.

## Before you start

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md). It's short.
2. Open or comment on an issue if the change is non-trivial (new mode, data schema change, new dependency).

## Setup

```bash
npm install
npm run dev     # http://localhost:5173
```

Test changes in a real browser before opening a PR. The dev server hot-reloads CSS and React updates.

## Style

- **Norwegian UI text, English code.** Domain terms (`kommune`, `fylke`, `kommunenummer`, `fylkesnummer`) stay as-is everywhere.
- **TypeScript strict.** No `any` unless you've added a comment justifying it.
- **Files under ~150 lines.** Split when they get larger.
- **Components are presentational.** Put logic in hooks under `src/hooks/` or in a `useXGame.ts` next to the component.
- **Types first.** Add to `src/types/` before plumbing through hooks.
- **Plain CSS.** No CSS-in-JS, no Tailwind. Use existing custom properties from `base.css`.
- **No hand-rolled memoization** unless you've profiled. The React compiler handles most cases.
- **Don't add comments** that restate the code. Comment only the *why* — invariants, workarounds, non-obvious decisions.
- **Don't add `console.log`** in committed code.

Run `npm run lint` and `npm run build` before pushing.

## Adding a game mode

1. Create `src/modes/<name>/use<Name>Game.ts` wrapping `useQuizState`.
2. Create `src/modes/<name>/<Name>Game.tsx` — presentational, takes the hook state as a prop.
3. Register in `src/config/gameModes.ts` with icon and Norwegian label.
4. Add a render branch in `App.tsx` (and the daily mode if it should participate).
5. Add CSS to `src/styles/modes.css`.

## Changing data

`data/kommuner.json` and `data/fylker.json` are generated. Don't edit by hand — change the script.

```bash
node scripts/prepare-data.mjs
node scripts/download-shields.mjs   # only fetches missing shields
```

If properties change shape, update `src/types/geo.ts` and run the build.

## Commits

- One logical change per commit.
- Imperative subject line under 72 chars (`Fix kommune area calculation`, not `Fixed area bug`).
- Body explains *why* if the diff doesn't already say it. Wrap at ~72 columns.
- Don't squash unrelated changes into a refactor commit.

## Pull requests

- Title matches the most important commit subject.
- Description: what changed, why, screenshots/GIFs for UI changes.
- Keep PRs small. Big refactors should land in their own PR before feature work.
- CI must be green. Don't merge with failing checks.

## Bugs and regressions

- Reproduce on `main` first.
- Open an issue with: browser/OS, day number (for daily issues), screenshot, console errors.
- A PR with a fix is always welcome — add a brief note explaining the regression cause in the commit body.
