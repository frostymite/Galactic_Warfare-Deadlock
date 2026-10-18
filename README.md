# Deadlock v13.0.1 — Sticky Header Cleanup

This tiny hotfix removes the legacy `DEADLOCK // <PAGE>` breadcrumb from the upper-left header. The main page title remains, and the scene-local diegetic HUD is unchanged.

## Upload
Replace these two files at the repository root:

- `styles.css`
- `sw.js`

Then wait for GitHub Pages to redeploy, open the live site in Chrome while online, and refresh once.

No assets, saves, galaxy data, combat data, or runtime modules are changed.
