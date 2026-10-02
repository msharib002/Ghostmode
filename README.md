# One More Door
A 1,000-room 3D first-person riddle and circuit-lock escape game for mobile browsers and Android. Read a riddle, choose one of three answer doors, then rotate a circuit to unlock it before time runs out. The pace gets faster as you progress. Each room has a unique clue and circuit configuration; clearing room 1000 completes the game. The first 24 clues are hand-written word riddles, and rooms 25–1000 use deterministic logic-riddle families with distinct inputs.

**[Get the ready-to-play Web + Android bundle on Gumroad](https://sharib25.gumroad.com/l/one-more-door-game)** · $4.99 · Use `DOOR20` for 20% off through October 8, 2026.

The Gumroad bundle includes a browser-ready ZIP and an offline Android APK. This repository also makes the source code public; the purchase supports further development and provides convenient builds. The APK is a debug-signed sideload build, not a Google Play release. The 1,000 clues and circuit configurations do not repeat within one full run.

## Controls
Touch: left thumb moves, drag right side to look, OPEN DOOR near a door. At the correct door, tap circuit tiles to rotate them and connect the source to the exit. Desktop: WASD/arrows to move, mouse to look (click to lock), E/Space to open, 1–9 to rotate lock tiles. Esc closes the lock. The countdown continues while solving the lock.

## Web
`cd web && npm ci && npm run dev`. For production: `npm run build`; deploy `web/dist` to any static host. GitHub Actions workflow deploys it to Pages when Pages source is set to GitHub Actions.

## Android
GitHub Actions builds the web bundle and packages it into the native Android shell. Download `One-More-Door-APK` artifact from the successful run. The `android/` project uses Gradle 8.10.2, JDK 17, Android SDK 35. No Gradle wrapper is included. Android WebView must support WebGL 2; performance varies by phone. The game works offline once installed.

## Current scope
Local best score, riddles followed by generated circuit locks, 1,000 timed rooms, movement, ambient audio and effects, settings, and sharing. No accounts, online leaderboard, monetization code, or remote model. Visuals are procedural 3D, designed to be readable and performant on phones.
