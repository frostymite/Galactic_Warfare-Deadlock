# ShipForge v3 Rendering Standard

## Goal

Create convincing mechanical spacecraft from a reusable deterministic component library without requiring a unique rendered image for every ship.

## Presentation stack

1. **Shadow** — soft contact/ambient shadow beneath the part.
2. **Extrusion** — darker offset geometry that creates thickness.
3. **Surface** — primary hull geometry in a three-quarter projection.
4. **Mechanical detail** — seams, ribs, brackets, vents, clamps, barrels, housings and manufacturer marks.
5. **Emissive detail** — engines, sensors, cockpit illumination and weapon indicators.

## Runtime motion

- Hull: slow sub-pixel idle drift.
- Engine: emissive breathing/pulse.
- Turret: limited tracking sweep.
- Sensor: slow rotational sweep.
- Catalog: pointer-based parallax on capable devices.

All motion must honor reduced-motion and performance settings.

## Component data contract

`renderProfile` is part of component metadata and currently contains:

- `view`: `three_quarter`
- `material`: slot-appropriate material profile
- `depth`: nominal visual extrusion depth
- `animation`: idle/engine/turret/sensor behavior
- `layers`: `extrusion`, `surface`, `detail`, `emissive`

The visual implementation can change in Godot later while these component IDs remain stable.

## Browser vs native

The browser/PWA uses layered SVG because it is deterministic, scalable and cheap. The native renderer can later map the same IDs to higher-fidelity 2.5D sprite rigs or 3D meshes. Both builds should continue reading the same ship records.
