# Upload Deadlock v13 Patch to GitHub

Apply this patch **after v12/v12.0.1**. It preserves the existing campaign/state model and does not require deleting your established assets.

## Root files to replace/upload

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`
- `manifest.webmanifest`
- `character-data.json`
- `asset-manifest.json`
- `scene-data.json`
- `actor-rigs.json`
- `asset-packs.json`
- `package.json`
- `capacitor.config.json`

## Runtime folder

Replace/upload the supplied files inside `runtime/`. Keep the folder structure exactly as packaged.

## New/updated scene and actor assets

Upload the supplied files to their exact paths inside `assets/`, including:

- `assets/rovan_clean.jpg`
- `assets/contact_dren_clean.jpg`
- `assets/scenes/blackglass_command_v3.svg`
- `assets/scenes/blackglass_briefing_v3.svg`
- `assets/scenes/blackglass_hangar_v3.svg`
- `assets/scenes/raven_cockpit_v3.svg`
- `assets/scenes/combat_industrial_v2.svg`
- `assets/scenes/urban_night_v2.svg`

Do **not** delete the existing original Rovan/Dren/Raven assets. v13's clean images are additional non-destructive runtime assets.

## APK workflow / tools

Upload:

- `.github/workflows/build-android-apk.yml`
- `tools/build-web.mjs`

GitHub folders can be created using the `folder/.keep` trick if Android's uploader will not upload a directory directly.

## After GitHub Pages redeploys

1. Export a campaign JSON backup first.
2. Open the Pages site in Chrome while online.
3. Refresh once and leave it open for 15–20 seconds.
4. Fully close/reopen Deadlock.
5. Verify Story, Ship, Combat, Galaxy and HQ each show one contained scene HUD—not stacked viewport overlays.

The service-worker cache name changes in v13, so the new shell should replace the prior cached build.
