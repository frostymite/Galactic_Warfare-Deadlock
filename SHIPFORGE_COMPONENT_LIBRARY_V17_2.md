# Deadlock v17.2 — ShipForge Component Library

This build moves ShipForge from abstract part IDs to a reusable visual hardware library.

## Included
- 64 reusable vector components across core, cockpit, wing, engine, weapon, cargo, and utility slots.
- Six fictional manufacturers with distinct design families.
- Ship-class compatibility plus explicit mount/socket compatibility.
- Persistent component IDs, prices, rarity, tags, stats, and standalone SVG asset paths.
- `ship-component-visuals.json` as an engine-neutral visual geometry source.
- `runtime/shipforge-visuals.js` for zero-fetch browser rendering.
- `component-library.html` browser catalog for reviewing all hardware offline.
- ShipForge v2 renderer assembles the real component vectors instead of generic slot shapes.

## Native migration
The component ID is the durable identity. Godot can later map the same ID to a richer 2D/3D resource while browser Deadlock continues using the SVG version. Saves therefore do not need to store rendered artwork.

## Next
Add manufacturer-specific high-detail art tiers, ship dealers/salvage inventory, persistent NPC ship ownership, damage state, and player installation/upgrades on the Raven.
