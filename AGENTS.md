# Guidance for AI agents

Short brief for AI assistants (Claude Code, Cursor, Copilot, etc.) editing this repo. If you're a human, you probably want [ARCHITECTURE.md](./ARCHITECTURE.md) and [CONTRIBUTING.md](./CONTRIBUTING.md) instead.

## Rules

1. **Read [ARCHITECTURE.md](./ARCHITECTURE.md) first.** Don't restate it here.
2. **Stick to existing conventions** — Norwegian UI strings, English code, kommune/fylke domain terms preserved.
3. **Keep files small** (<150 lines). Split before they grow.
4. **No new dependencies** without asking. The dependency list in `package.json` is short on purpose.
5. **No CSS frameworks.** Plain CSS with the existing custom properties.
6. **No hand-rolled `useMemo` / `useCallback`** unless profiling shows a need — React compiler is on.
7. **Don't add narration comments.** Comment the *why*, never the *what*.
8. **Don't write docs unless asked.** Especially: no per-task summary docs, status files, or "DECISIONS.md" sprawl.
9. **Don't commit `console.log`** or commented-out code.
10. **Verify the build** with `npm run build` (and `npm run lint`) before claiming done. UI changes also need a real browser check.

## Where things live

| You want to… | Look at |
|---|---|
| Add a game mode | `src/modes/<name>/` + `src/config/gameModes.ts` + `App.tsx` |
| Change daily logic | `src/hooks/useDailyQuiz.ts` + `src/utils/dailyChallenge.ts` |
| Change hint behavior | `src/utils/dailyHints.ts` + `src/components/ui/HintBar.tsx` |
| Touch map rendering | `src/components/map/` + `src/hooks/useMapPaths.ts` |
| Touch zoom/pan | `src/hooks/useMapZoom.ts` |
| Tweak styling | `src/styles/<area>.css` |
| Compute distance/area | `src/utils/geoDistance.ts` |

## Common pitfalls

- `d3.geoArea` is **winding-sensitive**. If you see absurd kommune areas (~5×10⁸ km²), the polygon is reversed — flip via `4π − steradians`. See `computeAreaKm2`.
- Zoom resets on question change via the `resetKey` prop. Forgetting to bump that is a common regression.
- `useQuizState` lives in `src/hooks/`, not under any mode folder. Per-mode hooks wrap it.
- `EMPTY_FEATURES` in `App.tsx` is intentional — non-active mode hooks should get `[]` so their shuffles are trivial.
- Mobile uses a separate `.cb-mobile-strip` inside the command bar; don't duplicate logic in a parallel component.
- Daily state is in `localStorage` (`utils/dailyStorage.ts`). If you change the schema, bump the day-key handling so old state doesn't break the UI.

## Tools

- Build: `npm run build` (TypeScript + Vite)
- Lint: `npm run lint`
- Dev: `npm run dev`
- Data refresh: `node scripts/prepare-data.mjs`, `node scripts/download-shields.mjs`

## Out of scope

- Server-side anything. This is a static SPA on Cloudflare Pages.
- Telemetry/analytics. Not in this repo.
- New game data sources without an issue first.
