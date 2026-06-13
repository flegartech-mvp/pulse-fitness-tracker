# Smokebomb Report

Date: 2026-05-27

## Project Type

- React Native / Expo app with Expo Web support
- Firebase Auth, Firestore, and Cloud Functions
- Package manager: npm (`package-lock.json`)
- Supabase: not used
- Chrome extension: no

## Commands Run

- `npm ci`
- `npm ci` in `functions/`
- `npm test`
- `npm --prefix functions run check`
- `npx expo install --check`
- `npm run validate`
- `npm audit --audit-level=moderate`
- `npm audit --prefix functions --audit-level=moderate`
- `npm run export:web -- --output-dir dist-smoke`
- `npm run smoke`

Expo web runs used disposable `EXPO_PUBLIC_FIREBASE_*` values in the process environment only. No real secrets or `.env` values were read or modified.

## Pages And Flows Tested

- Login page load
- Register page navigation
- Login validation errors
- Register validation errors
- Register form fill with invalid values
- Register back-to-login navigation
- Page refresh on login screen
- Invalid route fallback behavior
- Theme toggle presence across tested screens
- Console error collection during browser smoke
- Desktop, laptop, tablet, and mobile viewports

Authenticated Home, Workout, Achievements, Upgrade, logout, and workout-save CRUD flows were identified in code but were not fully browser-tested because the repo does not include Firebase emulator setup, seeded test credentials, or safe local auth fixtures.

## Viewports Tested

- Desktop: 1440x900
- Laptop: 1280x720
- Tablet: 768x1024
- Mobile: 390x844

## Screenshots Taken

- `output/playwright/desktop-login.png`
- `output/playwright/laptop-login.png`
- `output/playwright/tablet-login.png`
- `output/playwright/mobile-login.png`
- `output/playwright/register.png`
- `output/playwright/invalid-route.png`

## Bugs Found

- Expo 50 failed to export web on Windows under Node 24 because Metro tried to create shim folders for `node:*` built-ins such as `node:sea`.
- Jest picked up the new Playwright smoke spec and failed because Playwright tests must run through the Playwright runner.
- Desktop auth forms stretched nearly full-width, making login/register layouts weak on wide screens.
- Dependency audit reports remain in Expo/Firebase transitive dependencies. Automated fixes require breaking upgrades.

## Bugs Fixed

- Added a small Expo startup shim for Node 24 / Windows compatibility and routed Expo scripts through it.
- Scoped Jest to `__tests__/**/*.js` so unit tests and Playwright smoke tests do not conflict.
- Constrained login/register form widths on large screens while preserving mobile layout.
- Added a Playwright smoke suite with console-error detection and screenshot capture.

## Tests Added

- `tests/smoke/fitquest.spec.js`
  - App loads on all requested viewports.
  - Main unauth navigation works.
  - Login/register validation works.
  - Refresh preserves safe unauth app state.
  - Invalid route does not crash the app shell.
  - Browser console/page errors fail the smoke suite.

## Files Changed

- `package.json`
- `package-lock.json`
- `scripts/strip-node-prefixed-builtins.cjs`
- `playwright.config.cjs`
- `tests/smoke/fitquest.spec.js`
- `src/screens/LoginScreen.js`
- `src/screens/RegisterScreen.js`
- `SMOKEBOMB_REPORT.md`

## Final Verification

- Unit tests: pass, 3 suites / 14 tests
- Functions syntax check: pass
- Expo dependency check: pass
- Expo web export: pass
- Playwright smoke: pass, 6 tests
- Desktop/mobile screenshot review: pass for tested unauth screens
- Console errors: pass during Playwright smoke

## Remaining Issues

- `npm audit --audit-level=moderate` fails with 28 root-project vulnerabilities in Expo / React Native transitive packages. The suggested fix upgrades to Expo 56 / React Native 0.85 and is a breaking dependency migration.
- `npm audit --prefix functions --audit-level=moderate` fails with 9 moderate vulnerabilities through Firebase Admin / Functions transitive dependencies. The suggested fix is a breaking Firebase dependency change.
- `functions/package.json` requires Node 18, but this machine is running Node 24.15.0. Syntax checks pass, but deploy/runtime verification should use Node 18.
- Full authenticated browser smoke needs Firebase emulator wiring or safe test credentials.
- No lint or TypeScript command exists in `package.json`.

## Final Result

PARTIAL: the build/export, unit tests, function check, browser smoke, mobile screenshots, and console checks pass. The status is partial only because dependency audits still fail and authenticated Firebase-only flows need emulator or credentialed manual verification.
