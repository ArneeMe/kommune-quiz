# Draft: Leaderboard without user tracking or external dependencies

Goal: give players something to compete on, while keeping the current architecture —
a static SPA on Cloudflare, no accounts, no cookies, no analytics, no third-party
services, and nothing stored server-side that can identify a person.

The draft is three tiers. Tier 1 and 2 need **no server at all**. Tier 3 adds a
global comparison using only Cloudflare (the existing host), and stores **aggregate
counts only** — still zero personal data.

---

## Tier 1 — Local "personal leaderboard" (pure client, ship first)

Compete against yourself. All data stays in `localStorage`, which the app already
uses for the daily quiz (`src/utils/dailyStorage.ts` keeps `DailyHistory` with
streaks, totals and a per-day `DaySnapshot` map).

What to add:

1. **Results calendar / history view.** `DailyHistory.days` already stores every
   completed day (`correctCount`, `totalErrors`, `results`). Nothing new needs to be
   persisted — just render it: a month grid where each day is colored by result
   (perfect / all correct / partial / missed), plus the existing streak stats.
   New component: `src/components/ui/StatsOverlay.tsx`, opened from the command bar.

2. **Freeplay personal bests.** Freeplay modes already run a stopwatch
   (`src/hooks/useTimer.ts`) but the time is thrown away. Persist a best-times table:

   ```ts
   // src/utils/bestTimes.ts
   interface BestTime { timeMs: number; errors: number; dateKey: string }
   // key: `${mode}:${fylkesnummer ?? "all"}`
   type BestTimes = Record<string, BestTime>;
   ```

   On completion of a freeplay round, compare and save. Show "Ny rekord! 🏅" in
   `CompletionOverlay` and the previous best next to the timer while playing.
   Ranking rule suggestion: fewer errors wins first, time breaks ties (discourages
   spam-clicking through the map).

3. **Trend stats.** From `DailyHistory.days`: average errors last 7/30 days,
   distribution of per-question errors, best/worst mode. Pure derivation, no new storage.

Effort: small. Privacy: perfect (data never leaves the device). Follows the existing
pattern: types in `src/types/`, logic in a hook, presentational component.

## Tier 2 — Friend leaderboard via share links (still no server)

The share button in `DailyCompletionOverlay.tsx` already builds a Wordle-style text.
Extend it so friends can compete directly:

1. **Challenge links.** Append a URL with the result encoded in the **fragment**
   (`https://kommulde.no/#r=<encoded>`). Fragments are never sent to any server, so
   this stays tracking-free even at the network level. Encode compactly, e.g.
   `dayNumber.correctCount.totalErrors.e0-e1-e2-e3-e4` → base64url.

2. **On load, parse the fragment** (in `App.tsx` or a small `useChallengeLink` hook)
   and show a banner: "En venn klarte 4/5 med 7 feil på dag #123 — slå det!" After
   the recipient finishes the same day, the completion overlay shows the head-to-head
   comparison. Strip the fragment with `history.replaceState` after reading it.

3. **Optional local friends table.** Store received challenge results in
   `localStorage` keyed by a self-chosen label ("Mamma", "Jonas"), building a small
   local leaderboard per day from links you've opened. Names exist only on the
   player's own device.

Effort: small–medium. Privacy: perfect. This gives most of the social value of a
leaderboard with zero infrastructure — it's the Wordle model, which demonstrably works.

## Tier 3 — Global "how did I do today?" without identities (Cloudflare only)

A classic name-based global top list fundamentally requires storing something per
user and moderating it (spam, offensive names, cheating). The tracking-free
alternative: **store only an aggregate histogram per day** and show players their
percentile.

> "Bedre enn 78 % av dagens spillere 🎉"

### Data model — aggregate counts only

One row per (day, score bucket). No user IDs, no names, no IPs, no timestamps per
submission, no cookies. A submission is `count += 1` on one bucket; it is
mathematically impossible to trace a row back to a person, so there is no personal
data under GDPR at all.

```sql
-- Cloudflare D1 (or KV with one JSON blob per day)
CREATE TABLE daily_scores (
  day    INTEGER NOT NULL,   -- dayNumber from the seeded daily
  bucket TEXT    NOT NULL,   -- e.g. "5c-0e" = 5 correct, 0-error band
  count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, bucket)
);
```

Bucket suggestion: `correctCount` (0–5) × error band (0, 1–2, 3–5, 6–10, 11+) →
30 buckets/day. Coarse buckets are the privacy feature: even the first submitter of
a day is only "one of everyone who got 5/5 with 0 errors".

### API — a Worker in the same repo

`wrangler.json` is currently assets-only. Add a `main` Worker script alongside the
assets (no new service, no new dependency — it deploys with the same
`wrangler deploy`):

```jsonc
// wrangler.json additions
"main": "worker/index.ts",
"d1_databases": [{ "binding": "DB", "database_name": "kommune-quiz" }]
```

Two endpoints:

- `POST /api/daily/:day/score` — body `{ correctCount, totalErrors }`. Validate with
  the same bounds `dailyStorage.ts` already enforces (0–5 correct, errors < 1000),
  reject `day` outside today ±1 (timezone slack), bump the bucket.
- `GET /api/daily/:day` — return the histogram; the client computes its percentile.

Client side: after `saveDayResult` for round 0, fire the POST (best-effort, ignore
failures — the game must work offline), then GET and render the percentile line in
`DailyCompletionOverlay` and in the share text.

### Honest limitations

- **Duplicate submissions**: guard with a `localStorage` "submitted for day N" flag.
  That stops accidents, not malice — but since the output is a percentile over
  thousands of coarse buckets, a cheater can only nudge a distribution, not put a
  name on top. This is why aggregate-only is also the *robust* design, not just the
  private one.
- **Cloudflare logs**: request logs exist transiently at the platform level like for
  any static asset today; the app itself stores nothing per user. Worth one line in
  a privacy note on the page.
- **KV vs D1**: KV's eventual consistency can lose concurrent increments; D1 (or a
  Durable Object counter) is the correct choice for `count += 1`.

## What deliberately stays out

- Named global top lists → require identity, moderation and anti-cheat. Conflicts
  with the no-tracking goal; the percentile gives the same "how do I compare" payoff.
- Third-party leaderboard/analytics services → external dependency by definition.
- Accounts/logins, cookies, fingerprinting → obviously out.

## Suggested order

1. **Tier 1** — results calendar + freeplay best times. Immediate value, zero risk.
2. **Tier 2** — challenge links. Biggest social payoff per line of code.
3. **Tier 3** — only if global comparison proves wanted; it's additive and doesn't
   change anything shipped in 1–2.
