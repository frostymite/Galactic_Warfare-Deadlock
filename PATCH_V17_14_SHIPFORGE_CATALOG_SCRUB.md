# Deadlock v17.14.0 — ShipForge Catalog Scrub

## Goal

Remove every active dependency on the original placeholder component vectors so the parts browser, shipyard, assembled ships, offline cache, and Raven systems cannot trace back to the old placeholder art.

## Compatibility rule

Part IDs are preserved.

Examples such as `engine_military_06`, `weapon_rotary_09`, `core_twinboom_09`, and the rest of the 64-part catalog retain their IDs and gameplay metadata. This prevents existing saves from losing installed equipment.

Only the visual contract changes.

## New catalog

Schema:

`deadlock.shipforge.parts.v3`

Runtime:

`ShipForge 5.0.0`

Presentation:

`raster-only-three-quarter`

Every part now exposes:

```json
{
  "render": {
    "engine": "raster",
    "asset": "assets/ships/generated/...webp",
    "view": "three_quarter",
    "transparent": true,
    "fidelity": "generated-detail",
    "version": "17.14.0"
  }
}
```

No active part contains:

- `visual`
- `art`
- `artType`
- `artVersion`
- `renderProfile`

## Removed

Deleted from source and packaged output:

- `ship-component-visuals.json`
- `runtime/shipforge-visuals.js`
- 64 files under `assets/ships/components/`
- 64 corresponding files under `dist/assets/ships/components/`
- dist copies of the old fragment JSON/runtime

Total legacy visual files removed: **132**.

## Renderer

`runtime/shipforge.js` was replaced with ShipForge v5.

It loads only `ShipForgeCatalog` and uses `part.render.asset` for:

- component cards,
- installed-part cards,
- dealer inventory,
- parts locker,
- assembled ship previews,
- traffic ships,
- NPC modular ships.

There is no SVG fragment fallback.

## Offline behavior

Service-worker cache:

`deadlock-v17-14-shipforge-raster-only`

At install time it reads the v3 catalog and precaches only:

`p.render.asset`

The old component vector paths are not cached or requested.

## Build pipeline

`tools/build-shipforge-data.mjs` now:

1. requires the v3 schema,
2. rejects legacy visual fields,
3. verifies every replacement raster exists,
4. generates only `runtime/shipforge-catalog.js`,
5. verifies the v5 renderer uses the replacement asset.

It no longer generates component SVG files.

## Validation

Runtime/catalog compatibility sweep:

- **177 / 177 passed**
- 64 components
- 7 slots
- 6 ship classes
- Raven baseline preserved
- no legacy vector path in component or assembled-ship renders
- no `ShipForgeVisuals` runtime dependency

This patch intentionally solves the visual-source problem at the catalog level rather than adding another compatibility layer.
