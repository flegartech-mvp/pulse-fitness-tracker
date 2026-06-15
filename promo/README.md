# Pulse — Promo Pack

**Tagline:** Track every rep. Own all your data.

A fast, private workout tracker — no account, nothing leaves your device.

Built by FlegarTech.

## Assets in this folder

| File | Size |
| ---- | ---- |
| `01-instagram-square.png` | 1080×1080 |
| `02-instagram-story.png` | 1080×1920 |
| `03-instagram-reel-cover.png` | 1080×1920 |
| `04-facebook-post.png` | 1200×630 |
| `05-x-post.png` | 1600×900 |
| `06-linkedin-post.png` | 1200×1200 |
| `07-linkedin-banner.png` | 1584×396 |
| `08-github-social-preview.png` | 1280×640 |
| `09-portfolio-hero.png` | 1600×900 |
| `10-app-showcase.png` | 1920×1080 |

Source screenshots used to build these images are in [`source-screenshots/`](./source-screenshots/).

## Recommended use per platform

| Asset | Where to post |
| ----- | ------------- |
| `01-instagram-square.png` | Instagram feed, Facebook feed |
| `02-instagram-story.png` | Instagram / Facebook Stories |
| `03-instagram-reel-cover.png` | Instagram Reel / TikTok cover |
| `04-facebook-post.png` | Facebook link card, Open Graph image |
| `05-x-post.png` | X / Twitter post, link preview |
| `06-linkedin-post.png` | LinkedIn feed post |
| `07-linkedin-banner.png` | LinkedIn personal / company banner |
| `08-github-social-preview.png` | GitHub repo → Settings → Social preview |
| `09-portfolio-hero.png` | Portfolio / case-study hero, blog header |
| `10-app-showcase.png` | Product Hunt, press kit, README hero, slides |

## Suggested captions

**Instagram**
> Meet Pulse 💪 — a workout tracker that keeps every rep on YOUR device. No account, no cloud, no tracking. 70+ exercises with live PR detection.

**LinkedIn**
> Built Pulse — a fast, privacy-first workout tracker. No account required, nothing leaves the device. 70+ exercises, live PR detection, streaks, goals and weekly volume. 59 tests passing.

**X / Twitter**
> Pulse — track every rep, own all your data. Private, local-first workout tracker. 70+ exercises, live PRs.

**Facebook**
> Pulse is a private workout tracker — your data never leaves your device. Track lifts, streaks and PRs.

**GitHub (repo description / social preview alt)**
> Pulse — privacy-first workout tracker. React 19 + TS + Vite, 100% local, 59 tests passing.

## Source screenshots

- `FitnessTrackerApp-main/promo/source-screenshots/01-shot-02-dashboard.png` (from `audit/screenshots/final-ready/FitnessTrackerApp/02-dashboard.png`)
- `FitnessTrackerApp-main/promo/source-screenshots/02-shot-04-workouts.png` (from `audit/screenshots/final-ready/FitnessTrackerApp/04-workouts.png`)
- `FitnessTrackerApp-main/promo/source-screenshots/03-shot-05-progress.png` (from `audit/screenshots/final-ready/FitnessTrackerApp/05-progress.png`)
- `FitnessTrackerApp-main/promo/source-screenshots/90-mobile-03-mobile.png` (from `audit/screenshots/final-ready/FitnessTrackerApp/03-mobile.png`)

*All visuals use real product screenshots. No UI was mocked or invented.*

## Promo videos

Silent, real-screenshot motion demos (no audio track — license-safe). Built from the same real
captures as the images, animated with smooth Ken Burns motion + crossfades and a title / CTA card.

| File | Size | Duration | Platform |
| ---- | ---- | -------- | -------- |
| `videos/01-instagram-reel.mp4` | 1080×1920 | 00:00:18.90 | Instagram Reels |
| `videos/02-tiktok.mp4` | 1080×1920 | 00:00:18.90 | TikTok |
| `videos/03-youtube-short.mp4` | 1080×1920 | 00:00:18.90 | YouTube Shorts |
| `videos/04-linkedin-demo.mp4` | 1920×1080 | 00:00:30.00 | LinkedIn (longer demo) |
| `videos/05-x-demo.mp4` | 1600×900 | 00:00:27.40 | X / Twitter |
| `videos/06-facebook-demo.mp4` | 1920×1080 | 00:00:27.40 | Facebook |
| `videos/07-github-readme-demo.mp4` | 1280×720 | 00:00:27.40 | GitHub README embed |
| `videos/08-portfolio-hero.mp4` | 1920×1080 | 00:00:27.40 | Portfolio / case-study hero |

GIF fallbacks in [`videos/gifs/`](./videos/gifs/): `github-readme-demo.gif` (README embeds) and `short-demo.gif` (quick previews / chat).

**Structure:** title card → main UI reveal → 3 feature callouts → mobile / second screen → CTA card (“Built by FlegarTech · Demo-ready product · github.com/flegartech/FitnessTrackerApp”).
**Audio:** none (silent by default). Add royalty-free music in an editor if desired.

**Suggested video caption (Reels / TikTok / Shorts):**
> Pulse in motion 💪 — dashboard, workouts and progress in one quick reel. Private, local-first workout tracking.

To rebuild: `node build-videos.mjs FitnessTrackerApp-main` (or `promo/scripts/build-video.sh`).
