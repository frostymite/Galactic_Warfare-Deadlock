# Deadlock RPG — Cinematic Feature Matrix (v13)

This matrix deliberately separates what is **active in the playable build** from what is **scaffolded for later asset/animation passes**.

## Active now

### Living actors
- Subtle torso breathing, blink timing, micro-gaze, head drift and entrance motion.
- Relationship/mood-driven posture and lighting changes.
- Speech state with jaw/mouth motion.
- TTS boundary callbacks can pulse speech motion while a line is spoken.
- Actor notice/hit/threat reaction hooks.
- Established Rovan and approved Dren imagery used through clean text-free crops.

### Physical spaces
- Six distinct Raven interiors: cockpit, cargo bay, engineering, weapons bench, prisoner compartment and living quarters.
- Five Blackglass HQ rooms: Command Lounge, Briefing Room, Hangar, Rovan's Quarters and Contract Board.
- In-scene hotspots connect physical props/areas to the real game pages.
- Camera drift, parallax, traffic/crowd layers and moving environmental light remain active from Living Scenes.

### World/environment presentation
- Biome-aware FX for rain, snow, dust, mist, embers, debris, smoke, anomaly/space ambience and environmental light motion.
- Higher-detail, text-free scene plates for Blackglass Command/Briefing/Hangar, Raven cockpit, industrial combat and urban-night hubs.
- Scene-specific palette treatment instead of one universal blue/cyan card background.

### Combat / dogfight staging
- Ground-scene enemy actors correspond to actual living combatants and HP.
- Selected enemy gets a visible scene bracket; tapping an enemy changes the live combat target.
- Muzzle/hit flashes, sparks and combat-camera reaction hooks.
- Dogfight hostiles correspond to actual live enemy craft.
- Flight/damage telemetry, targeting presentation and ship-combat reaction hooks.

### Travel cinematics
- Departure, hyperspace, arrival, landing/docking, combat, victory and defeat cinematic sequences.
- Hyperspace streaking and Raven travel-state presentation.

### Diegetic HUDs
- One-HUD-per-scene ownership; HUDs are mounted *inside* living scenes rather than fixed over the whole app.
- Combat target/health/stamina/weapon/threat instrumentation.
- Dogfight shields/hull/pitch/radar/targeting instrumentation.
- Raven hull/shield/fuel/system instrumentation.
- Galaxy nav/fuel/compass/radar state.
- Story danger/contact/objective presentation.
- Blackglass secure-grid presentation.
- Holonet keeps its own dedicated interface rather than receiving another stacked HUD.

### Audio
- Procedural orchestral score.
- Device TTS character dialogue.
- Procedural environmental room/ship/world ambience.
- Local blaster, impact, door, engine, hyperspace and UI effect synthesis.
- Independent music/effects/voice controls.

### Standalone Android foundation
- GPU/WebGL2 background renderer with High / Balanced / Performance profiles.
- Capacitor native-runtime bridge.
- Native haptic/lifecycle/display hooks where supported.
- Native Preferences save mirror while preserving the existing save JSON.
- GitHub Actions debug-APK pipeline.
- Expandable local asset-pack manifest.

## Scaffolded / future high-detail passes

These are intentionally **not** represented as completed features yet:

- True skeletal full-body character animation with authored arm/hand/weapon movement.
- Bespoke approved expression images/meshes for every recurring NPC.
- Phoneme/viseme-quality lip sync and authored facial performance.
- Fully modeled 3D Raven interiors/exteriors and planetary scenes.
- Physically simulated character locomotion, cover movement and melee animation.
- Cinematic camera blocking authored per story beat rather than procedural camera drift.
- GPU 3D galaxy map with volumetric depth and full camera travel between systems.
- High-resolution planet-specific crowds, architecture, fauna, weather and local NPC populations.
- Large downloadable HD texture/animation/audio packs for a production APK.
- Production signed/release APK/AAB pipeline and store distribution.

## Preserve at every stage

The game/state layer remains authoritative. Rovan remains player-controlled. Existing canon, contracts, procedural GM, forced encounters, Blackglass HQ, The Raven, saves, fold layouts and offline-first play are never delegated to the visual renderer.
