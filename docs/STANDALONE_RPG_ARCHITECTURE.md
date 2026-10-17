# Deadlock v12 — Standalone RPG Architecture

v12 preserves the existing Deadlock game/state engine and introduces a second layer dedicated to standalone-game presentation.

## Authority boundaries

- `app.js` remains authoritative for campaign canon, choices, combat resolution, galaxy state, contracts, saves, and procedural GM behavior.
- `runtime/deadlock-gpu.js` is presentation only. It cannot change campaign state.
- `runtime/diegetic-hud.js` renders instruments from a read-only runtime snapshot.
- `runtime/native-bridge.js` owns Android/native capabilities and falls back gracefully on the PWA.
- `asset-packs.json` is the future expansion contract for larger bundled/downloadable visual and audio packs.

## Migration plan

1. Standalone APK + GitHub Actions build pipeline.
2. GPU backdrop and page-specific diegetic HUDs.
3. Character animation state machine: idle, blink, look, speak, react, injured, enter/exit, draw weapon.
4. Raven cinematic controller: departure, hyperspace, orbit, landing, docking, damage.
5. Scene graph: foreground, actors, props, weather, lights, particles, background traffic.
6. Combat visual controller: cover positions, recoil, impacts, hit reactions, movement, target locks.
7. Galaxy renderer: 3D-feeling star map, planets, route fly-throughs and approach sequences.
8. Asset packs for high-resolution textures, animation atlases, SFX, music and future 3D models.

The migration is intentionally incremental: no existing save file or campaign rule should depend on the renderer.
