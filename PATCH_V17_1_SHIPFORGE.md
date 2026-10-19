# Deadlock v17.1.0 — ShipForge Foundation

Cumulative patch for Deadlock v17.0.0 or v17.0.1.

## Added
- Engine-neutral `ship-parts.json` catalog.
- Deterministic ShipForge assembly runtime.
- Six initial ship classes: fighter, shuttle, light freighter, freighter, cargo vessel, patrol craft.
- Modular core, cockpit, wing, engine, weapon, cargo, and utility slots.
- Universal modules.
- Lightweight SVG vector renderer for ambient spacecraft.
- Living-scene traffic now uses generated modular ships.
- Lower Port flybys now use ShipForge light freighters.
- Articulated walking background silhouettes with head/body/arm/leg motion.
- Fold/performance throttling for ambient crowd and traffic.
- Offline service-worker caching for all new ShipForge runtime/data files.
- Build step that regenerates browser catalog data directly from `ship-parts.json`.
- ShipForge QA suite.

## Compatibility
The existing campaign/save format is not replaced. ShipForge ship records are additive and designed to remain portable to a future native runtime such as Godot.

The Raven v17.0.1 visual asset is included so this patch is cumulative and does not regress the ship-art replacement.

## QA
- ShipForge deterministic/compatibility suite: 6,714 assertions passed.
- 720 generated ships validated across all six classes.
- 717 unique deterministic ship signatures in the QA sample.
- Existing procedural engine suite: 26/26 passed, including 600 solvable cases.
- JavaScript syntax checks passed.
- Web bundle builds successfully.
- Service-worker cache manifest resolves with zero missing files.
