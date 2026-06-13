# Legacy code (archived 2026-06-12)

This folder preserves the original project before the full product rebuild. Nothing here is
used by the current app.

- `expo-app/` — the original **FitQuest** Expo SDK 50 / React Native + Firebase app
  (XP/leveling gamification, Firebase Auth + Firestore + Cloud Functions, PayPal premium flow).
- `expo-app-upgrade-pass/` — a stale duplicate of the same app that contained an earlier
  automated upgrade pass (see its `PROJECT_UPGRADE_REPORT.md` / `SMOKEBOMB_REPORT.md`).

## Why it was replaced

- Expo SDK 50 does not run on Node ≥ 24 (the dev server and web export crash), so the app
  could not be started, built, or tested on a current toolchain.
- The app hard-required a configured Firebase project (Auth + Firestore + Cloud Functions)
  with no offline/demo mode, so it could not run without provisioning private infrastructure.
- The product surface was a gamified XP logger (free-text exercise, reps × weight only) and
  was missing the core of a fitness tracker: exercise library, body metrics, progress charts,
  goals, units, history detail, dashboard.

Ideas carried forward into the new app: the rest-day-friendly (48 h) streak rule, training
volume math, and the input validation limits.
