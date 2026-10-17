# Deadlock Tactical OS v11 — Living Scenes

v11 begins the animated-universe phase. The goal is to make Deadlock feel like a place Rovan occupies rather than a collection of dashboards.

## What changed

The UI now injects a persistent 2.5D living scene into Story, HQ, Galaxy, Ship, Combat, and Dogfight.

Each scene is composed from separate layers rather than baking controls into artwork:

- environment plate
- camera drift / pointer parallax
- star and atmosphere layers
- traffic and crowd layers
- character actors
- holographic / cockpit props
- combat and dogfight FX
- vignette / lighting
- live status strip

This is important because future high-quality art can replace individual layers without rewriting the gameplay UI.

## Living character behavior

Characters now have visual presence inside scenes.

- subtle idle breathing / posture motion
- speaking animation synchronized with device TTS
- relationship mood affects posture and lighting
- irritated / wary / guarded / open presentation states
- Rovan visually reflects low-health injury state
- established character faces remain stable; placeholder expression art is not automatically swapped in as canon

## Travel animation

Galaxy travel can now visually move through:

- cockpit travel
- hyperspace streak field
- orbital arrival
- Raven orbit drift
- local planet environment themes

The starter environment themes are urban, desert, jungle, ice, volcanic, ocean, asteroid, ruins, unknown, Blackglass HQ, cockpit, combat, and orbit.

## Combat animation

Forced combat still uses the v10.1 rules engine, but the scene now reacts to it.

- live enemy count is represented visually
- player muzzle flash
- enemy muzzle flash
- hit flash
- high-danger camera tension
- enemy posture motion

Dogfight receives:

- Raven bank / drift
- hostile fighter motion
- flyby reaction
- weapon-fire streak
- ship-hit flash

## Cinematic view

Every living scene has an EXPAND control. This temporarily enlarges the current scene over the interface while preserving the underlying game state.

## Performance rules

- only one scene runtime exists at a time
- animation loops are cancelled on page changes
- global Animations setting still disables scene motion
- PHONE / UNFOLDED / FLEX use separate sizing rules
- no network dependency is introduced
- all scene data and assets are included in the offline cache

## Canon policy

Blackglass Station remains established HQ canon.

Generated planet environments remain gameplay/worldbuilding visuals until established through play.

Established Rovan / Dren / Raven art is not replaced by the v11 patch. Future expression assets should be approved before replacing canonical character faces.
