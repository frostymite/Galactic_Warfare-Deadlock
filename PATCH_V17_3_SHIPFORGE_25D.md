# Deadlock v17.3.0 — ShipForge 2.5D Visual Pass

This patch moves ShipForge from flat schematic components to a layered 2.5D presentation while preserving the existing deterministic ship records and v2 save schema.

## Visual system

- All 64 ShipForge components now render through five presentation layers: shadow, extrusion, surface, mechanical detail and emissive detail.
- Components use a front-starboard/elevated three-quarter projection instead of a flat icon presentation.
- Slot-specific mechanical detailing was added for hull cores, cockpits, wings, engines, weapons, cargo hardware and utility systems.
- Manufacturer marks remain deterministic and are tied to component metadata.
- Engine cores pulse, weapon mounts track, sensor assemblies sweep and assembled hulls idle-float when animation is enabled.
- Hover/pointer parallax is enabled in the component catalog on fine-pointer devices. Reduced-motion and performance modes disable the extra motion.
- Component catalog cards now crop to the component itself instead of the full ship coordinate plane, so small hardware no longer appears tiny inside the card.

## Native migration readiness

Every component now includes a `renderProfile` describing its view, depth, material family, animation role and layer set. These IDs and profiles are engine-neutral and can map to future Godot sprites, 2.5D scenes or meshes without changing saved ship identities.

## Offline behavior

The service worker cache key is bumped to `deadlock-v17-3-shipforge-25d`. During install it reads `ship-parts.json` and pre-caches every standalone component vector, keeping the complete visual component library available offline.

## Compatibility

- Ship save schema remains `deadlock.shipforge.ship.v2`.
- Existing deterministic seeds and component IDs are unchanged.
- No Apex Protocol, mission, economy or campaign state is modified.
