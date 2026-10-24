# UE-0 Architecture

## Principle
Deadlock gameplay state is independent of presentation. Unreal renders and animates state; it does not define campaign canon.

## Runtime layers
1. Game State — player, Raven, world, contracts, story flags, NPC memory.
2. Systems — save/load, procedural encounter director, dialogue selection, ShipForge compatibility.
3. Presentation — Actors, Animation Blueprints, Sequencer, UMG, VFX, audio.
4. Content — Data Assets / Data Tables for characters, locations, components, encounters.

## Offline rule
Core play must require no network connection. Network-backed features, if ever added, must be optional and must not block save/load, story generation, navigation, combat or inventory.

## Mobile / Fold rule
Gameplay HUD uses anchors, safe zones and responsive layout states rather than fixed pixel placement. Portrait, folded, unfolded and landscape layouts share state but may use different presentation arrangements.

## Raven rule
The Raven is one persistent ship actor. ShipForge changes attached component meshes/material state at named sockets; every scene reads the same loadout.

## Blackglass vertical slice
The first playable proof is a single polished Blackglass space with Rovan, one NPC conversation, one terminal interaction, the Raven in the hangar, local save/load and cinematic UI.
