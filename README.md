# Deadlock Tactical OS v12 — Standalone RPG Foundation

v12 begins the migration from an advanced offline web/PWA RPG into a standalone Android game while preserving the existing campaign engine.

## New in v12

- dependency-free WebGL2 cinematic backdrop renderer
- page-specific diegetic game HUDs
- Combat/Dogfight targeting and status instrumentation
- Raven telemetry and Galaxy navigation instrumentation
- Story objective/danger and Holonet encryption HUDs
- High / Balanced / Performance graphics profiles
- renderer and HUD can be disabled independently without affecting game state
- native Android bridge hooks for haptics, app state, display and native Preferences save mirroring
- `asset-packs.json` foundation for large future local visual/audio packs
- Capacitor 8 Android project configuration
- automatic GitHub Actions debug APK builder

## Preservation guarantee

`app.js` remains authoritative for story canon, campaign saves, contracts, combat, galaxy travel and procedural GM decisions. v12 presentation reads game state but does not own or rewrite it.

## Build

Browser/PWA development:

```bash
python -m http.server 8080
```

Prepare the standalone web bundle:

```bash
npm run build:web
```

Local Android development when Android tooling is installed:

```bash
npm install
npm run android:add
npm run android:debug
```

For the easiest route, upload the project to GitHub and use the included **Build Deadlock Android APK** Action. See `docs/APK_BUILD_GUIDE.md`.
