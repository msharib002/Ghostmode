# One More Door
An endless 3D first-person door puzzle for mobile browsers and Android. One shared Three.js game build, packaged offline in Android WebView.

## Controls
Touch: left thumb moves, drag right side to look, OPEN DOOR near a door. Desktop: WASD/arrows to move, mouse to look (click to lock), E/Space to open.

## Web
`cd web && npm ci && npm run dev`. For production: `npm run build`; deploy `web/dist` to any static host. GitHub Actions workflow deploys it to Pages when Pages source is set to GitHub Actions.

## Android
GitHub Actions builds the web bundle and packages it into the native Android shell. Download `One-More-Door-APK` artifact from the successful run. The `android/` project uses Gradle 8.10.2, JDK 17, Android SDK 35. No Gradle wrapper is included. Android WebView must support WebGL 2; performance varies by phone. The game works offline once installed.

## Current scope
Local best score, procedural clues, timed endless rooms, movement, audio, and sharing. No accounts, online leaderboard, monetization code, or remote model. Visuals are procedural 3D, designed to be readable and performant on phones.
