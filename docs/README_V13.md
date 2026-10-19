# Deadlock Tactical OS v13 — Cinematic RPG Systems

v13 deepens the standalone-RPG migration without replacing the campaign engine. The existing Story, procedural GM, contracts, forced encounters, Living Galaxy, Blackglass HQ, The Raven, saves, audio, fold support and offline behavior remain authoritative. v13 adds a richer presentation/runtime layer around them.

## What is active in v13

- Scene-local diegetic HUDs with strict one-HUD ownership. Story, HQ, Galaxy, Ship, Combat and Dogfight each mount one HUD *inside* the living scene rather than over the whole app. Holonet keeps its dedicated interface.
- Character actor rigs for subtle breathing, blinking, gaze drift, head movement, posture reactions, entrances and speech/jaw motion. TTS word-boundary events can pulse the mouth rig.
- The approved Dren Holonet face and the established Rovan image are reused through clean, text-free crops. No new face is silently promoted to campaign canon.
- Six physical Raven interior scenes: cockpit, cargo bay, engineering, weapons bench, prisoner area and living quarters.
- Five Blackglass HQ room scenes: Command Lounge, Briefing Room, Hangar, Rovan's Quarters and Contract Board.
- Scene hotspots connect physical spaces to the live game pages, e.g. holo table -> Galaxy, weapons bench -> Weapons, cargo -> Inventory.
- Environmental world FX for rain, snow, dust, mist, embers, debris, smoke, anomaly/space ambience and biome-specific light motion.
- Offline procedural environmental audio/effects for station hum, Raven machinery, urban/biome texture, doors, engines, blasters, impacts and hyperspace.
- Travel cinematics for departure, hyperspace, arrival, landing/docking, plus combat/victory/defeat sequences.
- Ground-combat staging tied to actual living combatants and HP. The selected enemy is visibly bracketed and can be selected directly from the scene.
- Dogfight staging tied to live hostile craft rather than decorative fighters.
- Page/scene-specific visual palettes to move away from one universal cyan dashboard appearance.
- High / Balanced / Performance graphics profiles.
- v12 GPU renderer, native bridge, native Preferences save mirror and GitHub Actions APK workflow retained.

## Accuracy and canon guards

- Rovan Kes remains player-controlled. The renderer never chooses his dialogue, thoughts or voluntary actions.
- Rovan remains a Clawdite bounty-hunter mercenary with the established obsidian/electric-cyan look and limited hard armor. No Mandalorian styling is introduced.
- Blackwake remains a heavy hand cannon; Luna and Sol remain the paired custom pistols.
- The Raven and Blackglass Station remain established visual/gameplay anchors.
- Generated world/location art remains gameplay/worldbuilding material until established through play.
- Presentation runtimes receive read-only snapshots; contracts, credits, dice, travel, combat results and campaign canon are still owned by the game/state layer.

## Android / APK

The repository includes a Capacitor configuration and `.github/workflows/build-android-apk.yml`. The workflow builds an Android debug APK and uploads it as **Deadlock-v13-debug-apk**. See `docs/APK_BUILD_GUIDE.md`.

The APK compile itself is not claimed as locally verified in this development environment because dependency retrieval timed out. The browser/runtime code and bundle passed 76/76 automated v13 regression checks with 0 browser/page errors; GitHub's Android runner performs the actual Gradle build.

## Offline-first

The core game remains offline-first. The service worker caches the runtime, data files, established art, actor rig metadata, scene data, and the new room/environment plates. Device TTS may require an offline Android voice to be installed separately.

## Development direction

v13 is a cinematic systems milestone, not a claim of finished AAA character animation. True skeletal/full-body acting, authored viseme facial animation, 3D ships/worlds and high-resolution downloadable asset packs remain future layers. The architecture is now prepared for those upgrades without rewriting the campaign engine.
