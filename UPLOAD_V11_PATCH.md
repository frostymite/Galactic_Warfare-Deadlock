# v11 GitHub Patch — Android Upload

Prerequisite: working v10 Living Galaxy + v10.1 Forced Encounters.

## Replace these root files

- `app.js`
- `styles.css`
- `sw.js`
- `manifest.webmanifest`
- `package.json`

## Add this new root file

- `scene-data.json`

## Add this new folder

`assets/scenes/`

Upload every SVG included in the patch's `assets/scenes/` directory.

## Do not replace

Do not delete or overwrite your existing approved:

- `assets/rovan.jpg`
- `assets/contact_dren.jpg`
- `assets/raven.jpg`
- `assets/raven_dedicated.jpg`
- `icons/`
- existing v10 character / planet / Blackglass assets

v11 is designed to animate those established assets rather than replace them.

## Refresh

After GitHub Pages redeploys:

1. Open the live site in Chrome while online.
2. Refresh once.
3. Leave it open for about 10–15 seconds.
4. Fully close Chrome / installed Deadlock.
5. Reopen Deadlock.

The new service-worker cache is `deadlock-v11-living-scenes-cache-1`.
