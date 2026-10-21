# Deadlock v17.13.1 — Raven Native Refit Hotfix

## User-visible issue

The Raven anchor itself was detailed, but any upgraded slot still called `ShipForge.renderPartSVG()`. That caused upgraded hardware to visually drop back to the old generic/simple ShipForge part style.

## Fix

The Raven no longer uses generic ShipForge part artwork for refits.

`runtime/raven-visual.js` now contains a Raven-native renderer for all seven modular slots:

- core
- cockpit
- wing
- engine
- weapon
- cargo
- utility

Installed ShipForge IDs remain authoritative. The hotfix only changes how those IDs are visualized on the Raven.

## Native visual language

Refits now inherit the Raven anchor's:

- dark obsidian / gunmetal hull treatment,
- metallic edge highlights,
- manufacturer/family trim variation,
- electric-cyan emissive systems,
- panel seams,
- rivets,
- battle wear,
- slot-specific geometry,
- real component-condition bands.

## Part-specific geometry

Design metadata now changes the Raven-native refit geometry itself.

Examples:

- engines: Twin Ion, Ring, Heavy, Slab and Trident each use different nozzle/shroud layouts,
- weapons: Missile, Rotary, Ion, Dorsal, Chin and Defense packages use different integrated weapon geometry,
- utility: Radar, Jammer, Sensor, Tow, Tractor, Smuggler, Armor and Repair packages resolve to different Raven hardware forms,
- wings / cockpit / core / cargo similarly use their own slot-native geometry.

## Compositing fix

The previous engine refit used `mix-blend-mode: screen`, which washed dark hardware into a bright sticker-like overlay.

The new CSS:

- uses normal material compositing,
- occludes the underlying anchor zone,
- applies Raven-native shadowing,
- keeps local cyan glow restrained,
- preserves worn/damaged/critical condition treatments.

## Validation

Representative integration harness:

- **16 / 16 passed**

Exhaustive compatible-refit sweep:

- **116 / 116 passed**
- **29 alternate compatible parts**
- all seven slots covered
- every alternate part installed successfully
- every alternate part produced Raven-native markup
- no alternate refit contained `shipforge-component`
- no alternate refit contained `sf-generated-art`

The canonical seven-part Raven loadout remains represented by the detailed anchor.

## Save compatibility

No save migration is required.

The hotfix does not change:

- ShipForge part IDs,
- installed component records,
- credits,
- stats,
- condition,
- repair,
- salvage,
- markets,
- ship ownership.

Only Raven presentation changes.
