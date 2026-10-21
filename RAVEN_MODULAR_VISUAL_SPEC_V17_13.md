# Raven Modular Visual Specification — v17.13 Design Foundation

## Purpose

The Raven is Deadlock's primary player ship and should no longer use a static hero asset that ignores ShipForge upgrades.

The current gameplay data already does the hard part correctly: the Raven is a persistent `light_freighter` stored in ShipForge, with real installed component instances, condition, damage, paint palette, derived stats, buying, salvage, installation, and repair.

The visual mismatch is that `app.js::ravenVisual(state)` still returns the legacy static `assets/ships/raven_cutout_v15.svg` for normal Raven presentation. Installing a new engine, weapon, cargo module, cockpit, wing, core, or utility package therefore changes gameplay stats without changing the hero ship.

This specification defines the bridge between the two systems.

The machine-readable source for the implementation is:

- `raven-visual-zones.json`

The intended future runtime module is:

- `runtime/raven-visual.js`

## Locked visual identity

The Raven is a realistic, field-modified modular pursuit freighter / tactical gunship.

It should read as:

- Rovan Kes / Deadlock's personal flagship,
- the primary mobile asset of the 3.2 Apex Protocol,
- practical rather than luxurious,
- predatory rather than sleek,
- visibly maintained, repaired, and customized over time,
- obsidian/gunmetal with electric-cyan system lighting.

### Stable identity rules

The Raven follows a **70 / 30 identity rule**:

- roughly 70% of its silhouette and visual language stays recognizable,
- roughly 30% can visibly change with installed hardware.

The following remain recognizable even after major upgrades:

- wedge-forward predatory profile,
- broad armored center mass,
- protected forward command/cockpit cluster,
- heavy aft propulsion mass,
- dark obsidian / gunmetal material family,
- cyan cockpit / engine / sensor signature,
- used-universe field-maintained surface treatment.

An installed component must never regenerate the Raven into an unrelated random ShipForge craft.

## Current Raven baseline

The Phase 2 migration already establishes the Raven as:

- Ship ID: `raven`
- Class: `light_freighter`
- Registry: `RVN-DL-01`
- Palette: `black_copper`

Current installed component definitions:

| Slot | Current part | Raven visual role |
| --- | --- | --- |
| Core | `core_twinboom_09` — Twinboom | central frame / hull architecture |
| Cockpit | `cockpit_armored_05` — Armored | protected forward command module |
| Wing | `wing_outrigger_09` — Outrigger | lateral structure / maneuver hardpoints |
| Engine | `engine_military_06` — Military | aft propulsion block |
| Weapon | `weapon_rotary_09` — Rotary | dorsal combat package |
| Cargo | `cargo_modular_08` — Modular | secure belly / flank cargo system |
| Utility | `utility_smuggler_06` — Smuggler | concealed ventral specialist bay |

Those seven IDs remain the gameplay source of truth. The visual system does not create a second upgrade inventory.

## Raven visual zones

### A — Core frame

ShipForge slot: `core`

Visual effect:

- center fuselage proportions,
- boom / rib geometry,
- armor architecture,
- panel density,
- structural mass.

Identity retention: high.

Replacing the core may visibly reshape the central body, but it must not erase the Raven's recognizable nose, cockpit relationship, dark material language, or overall pursuit-freighter silhouette.

Compatible current light-freighter cores:

- `core_skiff_04`
- `core_hauler_05`
- `core_twinboom_09`

### B — Cockpit

ShipForge slot: `cockpit`

Visual effect:

- canopy/glazing shape,
- armored brow,
- forward nose-command module,
- surrounding sensor glazing / protective plating.

Compatible current light-freighter cockpits:

- `cockpit_offset_03`
- `cockpit_armored_05`
- `cockpit_split_07`

### C — Wing / lateral structure

ShipForge slot: `wing`

Visual effect:

- outriggers,
- compact/stub pylons,
- cargo wing geometry,
- landing-oriented gull structure,
- maneuver-control surfaces.

Compatible current light-freighter wings:

- `wing_stub_03`
- `wing_cargo_05`
- `wing_gull_07`
- `wing_outrigger_09`

### D — Engine block

ShipForge slot: `engine`

This is one of the strongest visible progression zones.

Visual effect:

- nozzle count and size,
- engine shrouds,
- radiator/cooling surfaces,
- thrust-vectoring hardware,
- booster pods,
- exhaust geometry,
- cyan emissive intensity.

Compatible current light-freighter engines:

- `engine_twin_ion_01`
- `engine_ring_03`
- `engine_heavy_04`
- `engine_military_06`
- `engine_slab_08`
- `engine_trident_09`

### E — Weapon mounts

ShipForge slot: `weapon`

Visual effect:

- chin guns,
- dorsal turret shape,
- point-defense package,
- ion emitters,
- missile pods,
- rotary barrels and housing.

Compatible current light-freighter weapons:

- `weapon_chin_02`
- `weapon_dorsal_03`
- `weapon_defense_04`
- `weapon_ion_07`
- `weapon_missile_08`
- `weapon_rotary_09`

A weapon upgrade should be obvious at a glance.

### F — Cargo module

ShipForge slot: `cargo`

Visual effect:

- side pods,
- belly cargo pod,
- external clamps,
- dorsal/ventral saddle,
- secure Apex modular storage.

Compatible current light-freighter cargo systems:

- `cargo_sidepods_01`
- `cargo_belly_02`
- `cargo_clamps_05`
- `cargo_saddle_07`
- `cargo_modular_08`

### G — Utility module

ShipForge slot: `utility`

Utility is the most varied slot, so it resolves into sub-zones instead of always appearing in one location.

#### Dorsal electronics

Designs:

- sensor,
- comms,
- radar,
- jammer.

Visual language:

- antenna arrays,
- sensor masts,
- targeting optics,
- EW housings,
- relay fins,
- electronic apertures.

#### Armor overlay

Design:

- armor.

Visual language:

- nose reinforcement,
- cockpit armor,
- flank plates,
- belly protection,
- layered external plates.

#### Ventral aft

Designs:

- tow,
- tractor.

Visual language:

- tractor projector,
- tow coupling,
- aft utility ring,
- heavy ventral hardware.

#### Ventral concealed

Design:

- smuggler.

Visual language:

- hidden bay seams,
- flush access panels,
- false plating,
- low-profile concealed compartment.

#### Flank service

Design:

- repair.

Visual language:

- service pods,
- deployable tool housings,
- maintenance drones / arms,
- field-support compartments.

Compatible current light-freighter utility systems:

- `utility_sensor_01`
- `utility_comms_02`
- `utility_radar_03`
- `utility_armor_04`
- `utility_tow_05`
- `utility_smuggler_06`
- `utility_jammer_07`
- `utility_repair_08`
- `utility_tractor_09`

## Derived visual layers

Not every visible layer needs a new gameplay slot.

### Paint + markings

Source:

- ShipForge ship palette,
- ShipForge markings,
- registry.

The visual renderer should recolor stable hull material and markings rather than swap in a different ship.

Current Raven palette:

- `black_copper`

The realistic redesign should preserve the darker obsidian/gunmetal direction while translating this palette into a more grounded material treatment.

### Localized damage

Source:

- installed component instance condition,
- Raven hull state.

Recommended condition states:

| Condition | Visual state |
| ---: | --- |
| 85–100 | operational |
| 65–84 | worn |
| 40–64 | damaged |
| 1–39 | critical |
| 0 | destroyed |

Damage should be localized to the affected visual zone whenever possible.

Examples:

- damaged engine → scorched shroud, flicker, leaking/unstable exhaust,
- damaged weapon → blackened barrels, misaligned housing,
- damaged cockpit → cracked outer armor / emergency lights,
- damaged cargo → dented clamps / torn plating,
- damaged utility → damaged antenna, exposed service panel.

A damage overlay must not imply that a different part is installed.

### Emissive state

Source:

- engine package,
- utility package,
- weapon readiness,
- scene state.

The Raven's signature emissive color remains electric cyan unless a later gameplay system explicitly introduces configurable lighting.

## View contract

Every modular view uses a single fixed master canvas and coordinate origin so layers line up exactly.

### Hero 3/4

Master:

- 1536 × 1024
- transparent
- primary implementation target

Used by:

- Ship page hero,
- Blackglass hangar close presentation,
- upgrade confirmation,
- story ship callouts,
- future ship-focused cinematics.

This view must support all 36 currently compatible light-freighter component variants before the static Raven hero path is retired.

### Side profile

Master:

- 1536 × 1024
- transparent

Used by:

- detailed upgrade comparison,
- weapons/cargo inspection,
- later ShipForge management UI.

### Top tactical

Master:

- 1536 × 1024
- transparent

Used by:

- tactical displays,
- system overview,
- hardpoint visualization.

### Rear

Master:

- 1536 × 1024
- transparent

Used by:

- engine inspection,
- boost/damage presentation.

### Hangar scene

Master:

- 1536 × 1024
- scene background included

Used by:

- Blackglass docked presentation,
- showcase/cinematic framing.

## Layer naming contract

Runtime production path:

`assets/ships/raven/modular/<view>/<zone>/<part-id>.webp`

Hero example:

`assets/ships/raven/modular/hero_3q/engine_block/engine_trident_09.webp`

Optional alignment/mask asset:

`assets/ships/raven/modular/hero_3q/engine_block/engine_trident_09.mask.webp`

Base/static layers:

`assets/ships/raven/modular/hero_3q/base/raven_base.webp`

`assets/ships/raven/modular/hero_3q/base/raven_paint_mask.webp`

`assets/ships/raven/modular/hero_3q/base/raven_shadow.webp`

Every layer for a view must:

- use the exact master dimensions,
- use the exact same origin,
- preserve transparent empty space,
- avoid autonomous cropping,
- avoid baked background lighting unless the view explicitly allows it.

## Composite order

Primary hero composition order:

1. wing structure,
2. cargo module,
3. core frame,
4. engine block,
5. cockpit,
6. weapon mounts,
7. utility module,
8. paint / markings,
9. localized damage,
10. emissive effects.

The exact render implementation may use masks or grouped sublayers, but the logical order should remain stable.

## Runtime resolver contract

Future module:

`runtime/raven-visual.js`

Authoritative input:

`DeadlockShipForge.shipRecord(DATA, 'raven')`

and

`DeadlockShipForge.blueprint(DATA, 'raven')`

Installed component condition comes from:

`DATA.shipForge.components[installationId].condition`

Conceptual resolver:

```js
const ship = DeadlockShipForge.shipRecord(DATA, "raven");
const bp = DeadlockShipForge.blueprint(DATA, ship);

for (const [slot, partId] of Object.entries(bp.parts)) {
  const visual = RavenVisualZones.partMap[partId];
  layers.push(resolveLayer(view, visual.zone, partId));
}

applyPalette(ship.palette);
applyMarkings(ship.markings, ship.registry);
applyComponentDamage(ship.installations);
compose();
```

There must not be a parallel field such as `DATA.raven.engineTier` if the installed ShipForge component already answers that question.

## Legacy assets to retire from hero presentation

The following are useful as rollback/reference assets but should stop being the primary realistic Raven once coverage is complete:

- `assets/ships/raven_cutout_v15.svg`
- `assets/ships/raven_vector_v15.svg`
- `assets/ships/raven_flight.svg`
- `assets/ships/raven_landed.svg`
- `assets/ships/raven_orbit.svg`
- `assets/ships/raven_schematic.svg`
- `assets/raven.jpg`
- `assets/raven_dedicated.jpg`

The current static routing point is:

- `app.js::ravenVisual(state)`

It currently sends all normal Raven states to `raven_cutout_v15.svg`.

## Art-production checklist

### Stage 1 — anchor the identity

- [ ] realistic Raven hero 3/4 master
- [ ] transparent base skeleton
- [ ] paint/trim mask
- [ ] emissive mask
- [ ] contact shadow
- [ ] visual reference sheet showing fixed silhouette anchors
- [ ] current-loadout fully assembled reference render

Approval criteria:

- clearly recognizable at phone size,
- realistic metal/material response,
- Raven reads as a pursuit freighter/gunship,
- dark Deadlock identity is obvious,
- enough neutral structure remains to accept all module families.

### Stage 2 — hero 3/4 modular coverage

Required Raven-specific overlays:

- [ ] 3 core variants
- [ ] 3 cockpit variants
- [ ] 4 wing variants
- [ ] 6 engine variants
- [ ] 6 weapon variants
- [ ] 5 cargo variants
- [ ] 9 utility variants

Total:

- **36 installed-part hero mappings**

The realistic hero renderer should not replace the legacy static Raven until these 36 mappings have approved coverage or an explicitly approved Raven-specific fallback.

### Stage 3 — hero state overlays

- [ ] operational/worn material texture
- [ ] localized damaged treatment
- [ ] localized critical treatment
- [ ] destroyed/inactive treatment where applicable
- [ ] engine idle
- [ ] engine boost
- [ ] weapons ready
- [ ] warning/emergency light state

### Stage 4 — secondary identity views

- [ ] side profile current-loadout render
- [ ] top tactical current-loadout render
- [ ] rear engine current-loadout render
- [ ] Blackglass hangar current-loadout render
- [ ] cockpit/flight-deck interior identity frame

These establish consistent Raven identity across the rest of the app before full secondary-view modular coverage.

### Stage 5 — secondary modular expansion

Priority order:

1. engine variants,
2. weapon variants,
3. utility variants,
4. cargo variants,
5. wing variants,
6. cockpit variants,
7. core variants.

This order maximizes visible upgrade feedback for the least production cost.

## Runtime implementation checklist

- [ ] create `runtime/raven-visual.js`
- [ ] load `raven-visual-zones.json`
- [ ] read Raven ShipForge blueprint
- [ ] resolve all installed part IDs
- [ ] read each installed instance condition
- [ ] compose realistic hero layers
- [ ] cache resolved signature by `ship.signature` + condition bands
- [ ] invalidate cache after install/remove/repair/repaint/damage
- [ ] route `ravenVisual()` through the modular renderer
- [ ] preserve schematic fallback where appropriate
- [ ] update Blackglass hangar Raven presentation
- [ ] update Flight/Orbit Raven presentation
- [ ] update dogfight/cinematic Raven presentation
- [ ] keep old v15 assets as rollback fallbacks
- [ ] update service-worker precache for required Raven layers
- [ ] verify offline use
- [ ] verify unfolded Motorola Razr layout
- [ ] verify reduced-motion/performance modes
- [ ] verify save compatibility

## QA requirements

The visual spec must verify:

- every light-freighter-compatible ShipForge part is mapped,
- no mapped part points to the wrong slot,
- current Raven loadout has complete mappings,
- every required zone has a hero asset contract,
- utility sub-zone resolution covers every compatible utility design,
- no visual state creates a second source of upgrade truth,
- missing art falls back without corrupting the save,
- install/remove/repair/repaint operations invalidate visual composition,
- damage state is derived from component condition rather than duplicated state,
- source and `dist` remain equivalent when implementation begins.

## Production recommendation

The next production step should **not** be another generic Raven SVG.

The next step should be:

1. generate one realistic approved Raven anchor render,
2. derive a transparent base skeleton from that identity,
3. generate the seven **current installed** zone layers first,
4. assemble them in-browser to prove the compositing model,
5. then generate the remaining compatible hero variants until all 36 part IDs have coverage,
6. only after that retire the static `raven_cutout_v15.svg` path.

That sequence gives us a visibly realistic Raven quickly while guaranteeing that every future ShipForge purchase can eventually change the same ship instead of replacing it with unrelated artwork.
