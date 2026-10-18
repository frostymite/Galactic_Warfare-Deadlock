# Deadlock v13 — Cinematic RPG Systems

## Design goal

Make Deadlock feel like occupying a universe rather than operating a dashboard, while leaving the campaign engine authoritative and offline-first.

## Runtime boundaries

- `app.js`: campaign/game authority.
- `runtime/actor-rig.js`: presentation-only character micro-animation.
- `runtime/world-fx.js`: procedural environment FX.
- `runtime/cinematic-director.js`: staged full-screen sequences.
- `runtime/diegetic-hud.js`: scene-local HUD instrumentation.
- `runtime/deadlock-gpu.js`: GPU backdrop/presentation.
- `runtime/native-bridge.js`: Capacitor-native hooks/fallbacks.
- `runtime/cinematic-rpg.css`: v13 staging/rig/room styles.

## HUD ownership rule

Exactly one primary HUD may own a living scene. The HUD mounts inside the active scene rather than the viewport. Pages with a dedicated interface, such as Holonet, do not receive another global HUD. This prevents the overlay stacking reported during v12 testing.

## Actor canon rule

Actor rigs animate existing approved art whenever possible. A generated placeholder is never silently promoted to a canonical face. v13 restores the approved v9.2.3 Dren face via a clean crop and similarly uses a text-free crop of the established Rovan image.

## Performance rule

- High: full micro-animation/world FX.
- Balanced: reduced presentation load.
- Performance: stable/fallback motion with reduced detail.

All profiles preserve gameplay state and controls.
