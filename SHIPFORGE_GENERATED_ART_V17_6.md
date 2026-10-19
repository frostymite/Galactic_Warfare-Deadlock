# ShipForge Generated Art — v17.6

## Asset model

Each `ship-parts.json` component now carries both:

- `visual` — the established SVG/vector fallback.
- `art` — transparent generated WebP artwork.

The art files live under:

`assets/ships/generated/<slot>/<component-id>.webp`

There are 64 generated assets across seven slots: core, cockpit, wing, engine, weapon, cargo and utility.

## Why both formats remain

The generated artwork gives browser/native previews the more physical, rendered look requested for Deadlock. The vector fallback remains valuable for low-resource rendering, diagnostics, compatibility testing and future data migration.

Persistent ships still reference component IDs, not image filenames. A future Godot build can map the same ID to a sprite, layered 2.5D asset or full 3D mesh without invalidating a campaign save.

## Rendering

Generated assets were normalized to a shared 180×88 logical ShipForge canvas (stored at higher raster resolution). Slot placement is intentionally consistent so generated parts can be layered in the established order:

1. wing
2. cargo
3. core
4. engine
5. cockpit
6. weapon
7. utility

This is still a modular 2.5D assembly system, not a physically modeled 3D mesh system. Some combinations can intentionally look improvised or asymmetrical; later native work can add mount-specific transform metadata and true geometry while preserving the component IDs.

## Performance

The generated component library is under 1 MB in its current WebP form. Runtime motion is disabled automatically in performance/reduced-motion modes. Offline installation caches generated and vector assets together after the component catalog is loaded.
