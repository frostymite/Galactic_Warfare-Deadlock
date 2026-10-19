# Deadlock ShipForge v1

ShipForge is the first engine-neutral step toward Deadlock's native runtime. Instead of treating every background spacecraft as a unique baked image, a ship is a small deterministic record assembled from compatible reusable parts.

## Current classes

Fighter, shuttle, light freighter, freighter, cargo vessel, and patrol craft.

## Current slots

Core, cockpit, wing, engine, weapon, cargo, and utility. Individual parts declare compatible classes. Universal parts may be selected by every class that exposes the matching slot.

## Persistence contract

A ship can be saved using only its schema, classId, seed, palette, parts, markings, wear, registry, and optional persistent NPC ownership. Rendering is intentionally separate from the record so the browser can use lightweight SVG while a future Godot build can map the same part IDs to native 2D/3D scenes.

## Browser integration

Living-scene traffic now uses deterministic ShipForge craft instead of generic pill silhouettes. Lower Port flybys also use ShipForge. The renderer is designed for ambient traffic first, not the Raven, so established hero-ship art stays intact.

## Native path

`ship-parts.json` is the source-of-truth data file for future Godot resources/import. `runtime/shipforge-catalog.js` is generated from that JSON for the current browser runtime by `tools/build-shipforge-data.mjs`.
