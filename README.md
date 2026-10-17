# Deadlock Tactical OS v11 — Living Scenes

Offline-first solo bounty-hunter RPG for Rovan Kes / Deadlock.

v11 builds on the working v10 Living Galaxy and v10.1 Forced Encounters foundation and adds the first full animated-universe scene system.

## Highlights

- layered 2.5D living scenes
- Blackglass HQ continuous environment
- Raven cockpit scene
- hyperspace streak travel
- animated orbital arrival
- planet environment themes
- characters physically staged inside Story scenes
- speaking animation tied to TTS
- relationship-driven posture / lighting
- ground combat muzzle / hit reactions
- animated dogfight presentation
- cinematic scene expand mode
- offline and fold-friendly

See `LIVING_SCENES_V11.md` for architecture details and `QA_V11.md` for validation.

## Android / GitHub Pages

The v11 patch is designed to be applied on top of a working v10 + v10.1 installation.

Upload the v11 root files and the new `assets/scenes/` folder. Existing canonical artwork in `assets/` should remain in place.

After GitHub Pages redeploys, open the live page once in Chrome while online and refresh so the new service worker cache can install.
