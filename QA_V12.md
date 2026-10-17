# QA — Deadlock v12 Standalone RPG Foundation

## Static validation

- `app.js`: Node syntax PASS
- `runtime/deadlock-gpu.js`: PASS
- `runtime/native-bridge.js`: PASS
- `runtime/diegetic-hud.js`: PASS
- `tools/build-web.mjs`: PASS
- JSON application/config data: PASS
- Offline web bundle generation: PASS (87+ source assets copied into `dist`)

## Browser regression

Headless Chromium was run against an inline QA build with test-only localStorage/fetch shims because the harness blocks localhost/file navigation and local image resources.

- GPU runtime canvas created: PASS
- Diegetic HUD created: PASS
- Runtime snapshot exposed: PASS
- Overview boot: PASS
- Story: PASS, 0 horizontal overflow
- Galaxy: PASS, 0 horizontal overflow
- Ship: PASS, 0 horizontal overflow
- Combat: PASS, 0 horizontal overflow
- Dogfight: PASS, 0 horizontal overflow
- Holonet: PASS, 0 horizontal overflow
- Settings: PASS, 0 horizontal overflow
- GPU toggle: PASS
- HUD toggle: PASS
- Graphics profile selector: PASS
- Renderer controls leave campaign credits/state unchanged: PASS
- PHONE 393×873: PASS
- UNFOLDED 744×828: PASS
- FLEX 744×460: PASS
- UNFOLDED 828×744: PASS

Final targeted rerun: 25/25 checks passed with zero script/runtime errors. An earlier broader run passed 38/38 checks before native persistence hooks were added.

## Android build pipeline

The Capacitor/GitHub Actions project structure and workflow are included. The local container could not complete `npm install` within its network timeout, so the Android Gradle compile itself was not claimed as locally validated. GitHub Actions is configured to install Capacitor dependencies, build the web bundle, create/sync Android, compile `assembleDebug`, and publish `app-debug.apk` as an artifact.
