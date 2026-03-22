# Proposed GitHub Issues for Kommune Quiz

Below are issues identified from a thorough codebase review. Copy each section to create a new GitHub issue.

---

## Issue 1: Add unit and integration tests

**Labels:** `enhancement`, `testing`

### Description

The project currently has no test files. Adding tests would improve reliability and catch regressions early.

### Suggested scope

- Unit tests for utility functions (`src/utils/geo.ts`, `src/utils/dailyChallenge.ts`, `src/utils/dailyStorage.ts`)
- Unit tests for custom hooks (`useQuizState`, `useTimer`, `useDailyQuiz`)
- Integration tests for game mode components
- Set up Vitest (natural fit for a Vite project)

### Acceptance criteria

- [ ] Test framework configured (Vitest + React Testing Library)
- [ ] Core utility functions have >80% coverage
- [ ] Custom hooks have basic test coverage
- [ ] CI runs tests on PRs

---

## Issue 2: Improve accessibility (a11y)

**Labels:** `enhancement`, `accessibility`

### Description

The app currently lacks accessibility support, making it difficult or impossible for users who rely on screen readers or keyboard navigation.

### Areas to address

- No ARIA labels on interactive SVG map shapes (`KommuneShape` components)
- No keyboard navigation for map clicks in map mode (only mouse clicks supported)
- Color-only feedback (green/red for correct/wrong) without text alternatives
- Some buttons lack `title` or `aria-label` attributes
- No skip-to-content link
- Focus management during quiz transitions

### Acceptance criteria

- [ ] All interactive elements have ARIA labels
- [ ] Map mode supports keyboard navigation
- [ ] Color feedback has text alternatives
- [ ] Screen reader can navigate the full quiz flow

---

## Issue 3: Add mobile support with responsive layout

**Labels:** `enhancement`, `mobile`

### Description

The app is currently desktop-focused. Mobile users need responsive layout and proper touch handling for the map-based quiz.

### Areas to address

- Responsive CSS for small screens (command bar, game panels, map viewport)
- Touch gestures for map interaction (pinch-to-zoom, drag-to-pan already partially supported via scroll/wheel)
- Autocomplete dropdown positioning on mobile keyboards
- Proper viewport meta tag and mobile-friendly sizing
- Test on common mobile screen sizes

### Acceptance criteria

- [ ] Quiz is playable on mobile devices (iOS Safari, Chrome Android)
- [ ] Map interaction works with touch gestures
- [ ] UI elements don't overlap on small screens
- [ ] Autocomplete works with mobile keyboard visible

---

## Issue 4: Add CI/CD pipeline with GitHub Actions

**Labels:** `enhancement`, `infrastructure`

### Description

No CI/CD pipeline is configured. Adding GitHub Actions would catch build failures and lint errors before merge.

### Suggested workflow

- Run `npm ci` to install dependencies
- Run `npm run lint` (ESLint)
- Run `tsc -b` (TypeScript type checking)
- Run `npm run build` (Vite build)
- Run tests (once Issue #1 is resolved)

### Acceptance criteria

- [ ] GitHub Actions workflow file created (`.github/workflows/ci.yml`)
- [ ] CI runs on all PRs to `main`
- [ ] Build, lint, and type-check gates pass before merge

---

## Issue 5: Handle localStorage failures gracefully

**Labels:** `bug`, `resilience`

### Description

Several hooks silently catch and ignore localStorage errors with empty `catch {}` blocks:

- `src/hooks/useTheme.ts` (lines 14, 23)
- `src/utils/dailyStorage.ts` (lines 23, 32)

This means users in private browsing mode or with full storage quotas will lose their theme preference and daily quiz progress without any feedback.

### Suggested fix

- Log warnings to console in catch blocks
- Optionally show a non-intrusive UI toast warning users that progress won't be saved
- Consider an in-memory fallback when localStorage is unavailable

### Acceptance criteria

- [ ] No empty catch blocks for localStorage operations
- [ ] Graceful degradation when localStorage is unavailable
- [ ] User is informed if persistence is not working

---

## Issue 6: Fix unsafe type assertions and non-null assertions

**Labels:** `bug`, `code-quality`

### Description

Several files use unsafe type casts or non-null assertions (`!`) that could cause runtime errors:

1. **`src/components/map/GameMap.tsx:61`** — unsafe cast `as ReturnType<typeof geoPath>` with acknowledged comment
2. **`src/modes/map/MapGame.tsx:27-28`** — `game.lastWrongKommune!` and `game.currentTarget!` use non-null assertions
3. **`src/utils/geo.ts:28-31, 78-81`** — geometry cast to `Polygon | MultiPolygon` without validation
4. **`src/components/map/FylkeBorders.tsx:19`** — cast to `GeometryCollection` without validation

### Suggested fix

- Replace non-null assertions with proper null checks or early returns
- Add runtime validation before geometry type assertions
- Use type guards for d3-geo types

### Acceptance criteria

- [ ] No non-null assertions (`!`) in production code
- [ ] Geometry types validated before casting
- [ ] TypeScript strict mode passes without unsafe casts

---

## Issue 7: Fix potential race condition in useTimer hook

**Labels:** `bug`

### Description

In `src/hooks/useTimer.ts`, the `useEffect` dependency on `elapsed` could cause stale closure issues:

```ts
startTime.current = Date.now() - elapsed * 1000;
```

If `elapsed` updates frequently while the timer is running, the restart logic could become inconsistent.

### Suggested fix

- Store `elapsed` in a ref to avoid stale closures
- Or restructure the effect to not depend on `elapsed` state

### Acceptance criteria

- [ ] Timer works correctly across start/stop/restart cycles
- [ ] No stale closure issues with elapsed time calculation

---

## Issue 8: Add error boundaries for component failure handling

**Labels:** `enhancement`, `resilience`

### Description

The app has no React error boundaries. If a component throws (e.g., due to bad map data or missing coat of arms), the entire app crashes with a white screen.

### Suggested implementation

- Add a top-level `ErrorBoundary` component wrapping the quiz
- Add a secondary boundary around the map component (most likely to encounter data issues)
- Show a user-friendly error message with a retry/restart option

### Acceptance criteria

- [ ] Error boundary catches component render errors
- [ ] User sees a friendly error message instead of a white screen
- [ ] User can recover (restart quiz) after an error

---

## Issue 9: Add score persistence (best times per fylke/mode)

**Labels:** `enhancement`, `feature`

### Description

From the project's `ai.md` wishlist: scores are not persisted between sessions. Adding localStorage-based score tracking would add replayability.

### Suggested implementation

- Store best times per fylke per game mode in localStorage
- Show personal best on the completion overlay
- Optionally show a "stats" or "history" view

### Acceptance criteria

- [ ] Best times saved per fylke and game mode
- [ ] Completion overlay shows personal best comparison
- [ ] Stats persist across browser sessions

---

## Issue 10: Validate edge cases in daily challenge generation

**Labels:** `bug`

### Description

In `src/utils/dailyChallenge.ts`, if the `features` array is empty or smaller than the number of questions (5), `generateDailyChallenge` could produce undefined entries or infinite loops.

### Suggested fix

- Add guard clause: return empty challenge if `features.length < 5`
- Add validation that selected features exist and have valid geometry
- Add a fallback for dates that produce poor seed values

### Acceptance criteria

- [ ] Daily challenge handles edge cases gracefully
- [ ] No undefined entries in generated questions
- [ ] Appropriate fallback when not enough features are available

---

## Issue 11: Fix NameInput suggestion key uniqueness

**Labels:** `bug`

### Description

In `src/components/ui/NameInput.tsx:90`, municipality names are used as React keys:

```tsx
key={name}
```

While unlikely, if duplicate names appear in suggestions, React will treat them as the same element, causing rendering bugs.

### Suggested fix

Use index combined with name, or a unique ID:
```tsx
key={`${index}-${name}`}
```

### Acceptance criteria

- [ ] Suggestion list uses unique keys
- [ ] No React key warnings in console

---

## Issue 12: Fix typo in documentation filename

**Labels:** `documentation`

### Description

The architecture documentation file is named `architecure.md` (missing the second 't'). Should be `architecture.md`.

### Acceptance criteria

- [ ] File renamed from `architecure.md` to `architecture.md`
- [ ] Any references to the old filename updated
