# Deadlock RPG — Cinematic Feature Matrix

## Active now

- Existing v11 layered living scenes, camera drift, parallax, particles, traffic and actor idle/speaking states.
- GPU-accelerated full-screen cinematic backdrop with page-specific visual themes.
- Diegetic HUD framework instead of one universal flat-dashboard presentation.
- Combat target reticle, health/stamina instrumentation and threat lock presentation.
- Dogfight shield/hull instrumentation and targeting presentation.
- Raven telemetry HUD with shields, hull and fuel.
- Galaxy navigation HUD with location/phase/fuel state.
- Story danger/objective HUD.
- Holonet encrypted-channel instrumentation.
- High / Balanced / Performance renderer profiles.
- Native APK detection and haptic/persistence/display hooks.
- Native Preferences save mirror while retaining the original save JSON format.
- GitHub Actions debug-APK build pipeline.
- Expandable asset-pack manifest for much larger local installs.

## Renderer/asset system now scaffolded

- Full-body actor animation state machine: idle, blink, eye focus, head turns, body shifts, speaking, reaction, injured, weapon draw, enter/exit.
- Layered facial animation and lip-sync driven by spoken dialogue timing.
- Raven cinematic states: hangar launch, departure, hyperspace, orbit insertion, atmospheric entry, landing, docking and damage.
- Blackglass physical interfaces: holographic contract wall, briefing table, hangar diagnostics and environmental crew activity.
- Ground combat staging: cover positions, movement, recoil, impacts, smoke, sparks and hit reactions.
- Dogfight staging: ship banks, target tracking, lasers, countermeasures, shield strikes and explosions.
- GPU galaxy map with depth, rotating planets, route fly-throughs and system camera travel.
- Planet-specific approach plates, surface hubs, crowds, weather, day/night and local NPC populations.
- Larger local texture/audio/animation packs suitable for APK distribution.

## Preserve at every stage

Rovan remains player-controlled. Existing campaign canon, contracts, procedural GM, forced encounters, Blackglass HQ, The Raven, saves, fold layouts and offline-first play remain authoritative in the game/state layer rather than the renderer.
