# Deadlock UE — Phase UE-0

Fresh Unreal Engine 5.8 rebuild. Deadlock Legacy v17.16 remains the functional reference implementation.

## UE-0 goals
- C++ mobile project foundation
- Android-first, offline-first architecture
- persistent SaveGame schema
- legacy data migration staging
- Blackglass vertical-slice target
- modular Raven / ShipForge data model
- responsive UMG for foldable/mobile aspect changes

## Rendering baseline
Use Unreal's supported mobile renderer first. Cinematic quality will come from scene composition, materials, lighting, animation, VFX and scalable device profiles rather than the experimental Android desktop renderer.

## Planned Content layout
/Game/Maps
/Game/Characters/Rovan
/Game/Characters/NPC
/Game/Locations/Blackglass
/Game/Ships/Raven
/Game/ShipForge
/Game/UI
/Game/Data
/Game/Audio
/Game/VFX

## First playable milestone
L_Blackglass_Prototype: cinematic Blackglass scene, Rovan pawn, one interactive NPC, one terminal, Raven visible in hangar, dialogue overlay, persistent local save.

Legacy assets are migration inputs. Do not delete or rewrite the v17.16 web build.
