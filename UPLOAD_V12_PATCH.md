# v12 GitHub Patch Upload

Apply this patch on top of the working v10 + v10.1 + v11 repository.

## Replace/upload at repository root

- `app.js`
- `index.html`
- `character-data.json`
- `scene-data.json`
- `manifest.webmanifest`
- `sw.js`
- `package.json`
- `capacitor.config.json`
- `asset-packs.json`
- `README.md`
- `QA_V12.md`

## Add these directories

- `runtime/`
- `tools/`
- `docs/`
- `.github/workflows/`

Do **not** delete your existing `assets/`, `icons/`, `galaxy-data.json`, or `asset-manifest.json`. v12 deliberately layers the standalone runtime on top of the established v11 project and approved campaign art.

After GitHub Pages redeploys, refresh once online. For the APK, use **Actions → Build Deadlock Android APK → Run workflow**.
