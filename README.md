# Pulse — Fitness Tracker

A fast, private, production-quality fitness tracking web app: plan and run workouts, browse a
70-movement exercise library, track body weight, volume, consistency, and personal records, and
work toward measurable goals — all stored locally in your browser, no account or backend required.

Dark-mode-first, mobile-first, fully responsive. Built with React 19 + TypeScript (strict) +
Vite + Tailwind CSS 4.

---

## What changed (full rebuild, June 2026)

This repo previously contained **FitQuest**, an Expo SDK 50 / React Native + Firebase gamified
workout logger. It was replaced with a complete rewrite because:

- Expo SDK 50 does not run on Node ≥ 24 — the dev server and web export crash, so the app could
  not be started, built, or verified on a current toolchain.
- It hard-required a provisioned Firebase project (Auth + Firestore + Cloud Functions) with no
  offline or demo mode, so it could not run out of the box at all.
- The product surface was thin (free-text exercise names, reps × weight only, XP/PayPal-premium
  demo flows) and missing the core of a fitness tracker: exercise library, body metrics,
  progress charts, goals, units, a real dashboard.

The original code is preserved untouched in [`legacy/`](legacy/README.md). Ideas carried over:
the rest-day-friendly 48-hour streak rule, training-volume math, and input validation limits.

## Features

- **Dashboard** — today's/next workout, live "resume session" state, weekly sessions / volume /
  estimated calories / active time, streak with last-7-days view, weekly volume chart, goal
  rings, rule-based coach tips, recent workouts.
- **Workout tracking** — build workouts (exercises, sets, reps, weight, duration, distance,
  rest), schedule them, run a live session with elapsed timer, per-set check-off and rest
  countdown, finish/discard, edit, delete, repeat, full history grouped by month. PR detection
  with toasts on completion.
- **Exercise library** — 70 built-in movements across chest / back / legs / shoulders / arms /
  core / cardio / full body, with search, category filters, per-exercise personal stats,
  "suggested for balance" based on your least-trained areas, and custom exercises.
- **Progress** — body-weight log with trend chart and 7/30-day deltas, weekly volume trend,
  muscle balance breakdown, GitHub-style consistency heatmap, monthly summary, and a personal
  records board (best set + estimated 1RM via Epley).
- **Goals** — body weight, strength (per lift), consistency (sessions/week), endurance (cardio
  minutes/week). Progress is computed from real activity, never self-reported.
- **Profile & settings** — name/age/height/activity level/focus, kg ↔ lb and cm ↔ in units
  (applied instantly everywhere), dark/light theme, JSON export, demo-data reset, clear-all.
- **Polish** — loading skeletons (code-split routes), empty states everywhere, error boundary,
  inline form validation, toasts, custom charts (no chart library), accessible dialogs and
  controls, safe-area-aware bottom navigation on mobile.

## How to run

Requires Node 20+ (tested on Node 24).

```bash
npm install
npm run dev        # dev server → http://localhost:5173
```

On first launch the app seeds **ten weeks of realistic demo data** (a push/pull/legs + cardio
split with progressive overload, a body-weight trend, and three goals) so every screen is alive
immediately. Clear or reload it anytime in **Settings → Data**.

## Commands

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Start the dev server                              |
| `npm run build`     | Typecheck + production build to `dist/`           |
| `npm run preview`   | Serve the production build                        |
| `npm run typecheck` | TypeScript project check (strict)                 |
| `npm run lint`      | ESLint (typescript-eslint + react-hooks)          |
| `npm test`          | Vitest — 59 tests (domain logic + app smoke)      |
| `npm run check`     | All of the above, in order                        |

Dev utilities (need the app running, use system Chrome):
`node scripts/screenshot.mjs` captures every page at desktop + mobile sizes;
`node scripts/flows.mjs` drives the main user flows end-to-end.

## Architecture

```text
src/
  types/        Domain model (Workout, Exercise, Goal, BodyMetric, Profile, AppData)
  lib/          Pure logic: dates, units, calc (volume/1RM/calories), stats (streaks,
                weekly aggregates, records, goal progress), recommendations, validation,
                storage (adapter interface + localStorage/memory implementations)
  data/         Built-in exercise library + deterministic demo-data generator
  state/        AppDataProvider (load/persist/CRUD) and ToastProvider
  components/   UI kit (Button, Card, Modal, Field, …) and custom SVG charts
  layout/       Responsive shell: sidebar (desktop) / bottom nav (mobile)
  features/     One folder per page: dashboard, workouts, exercises, progress,
                goals, settings
```

Design decisions worth knowing:

- **Storage is a one-file swap.** Everything persists through the `StorageAdapter` interface
  (`src/lib/storage.ts`) as a single versioned document with a migration hook and corrupt-data
  quarantine. Replacing localStorage with IndexedDB or a real backend API touches only that
  boundary.
- **All stats are derived, never stored.** Streaks, records, weekly volume, and goal progress
  are recomputed from the workout log, so they can't drift out of sync.
- **Canonical units internally** (kg, km, cm, seconds); conversion happens only at the
  input/display edge.
- **Calories are honest estimates** (MET × body weight × duration) and always labeled `~`.

## Known limitations

- Single device / single browser profile — no sync, no accounts (export/import via JSON only;
  import UI not built yet).
- Calorie figures are MET-based estimates, not measurements.
- Rest timer doesn't fire a notification/sound when it ends; timers don't run when the tab is
  closed (elapsed time is still correct — it's computed from `startedAt`).
- No workout templates/routines feature yet ("Repeat" on any past workout covers the basics).
- English only; week starts on Monday.

## Next steps (if taking this to production)

1. Backend sync: implement a `StorageAdapter` against an API (or Supabase/Firebase), add auth,
   and reconcile with local data for offline-first behavior.
2. JSON import to complement export; per-device merge strategy.
3. PWA manifest + service worker for installability and true offline.
4. Routine templates, supersets, plate calculator, exercise charts per lift.
5. Notifications for rest timer and workout reminders.
6. E2E tests in CI (the `scripts/flows.mjs` scenario, ported to Playwright Test).

---

Made by FlegarTech. If this project helped you, you can [support development](https://paypal.me/TiniFlegar).
