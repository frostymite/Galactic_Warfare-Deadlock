# Deadlock v17.13.0 — Live Modular Raven Renderer

This patch begins the Raven visual-production phase by removing the normal hero-view dependency on the old static Raven cutout.

## Problem fixed

Before v17.13, `app.js::ravenVisual()` returned `assets/ships/raven_cutout_v15.svg` for nearly every normal Raven view.

That meant ShipForge upgrades already changed:
- installed component records,
- ship stats,
- damage/condition,
- market value,
- combat performance,

but did **not** change the main Raven artwork.

## New live renderer

Added:

- `runtime/raven-visual.js`
- `runtime/raven-visual.css`
- `qa/raven-visual.cjs`

Normal Raven presentation now asks `DeadlockRavenVisual` for the current visual.

The renderer reads:

- `DeadlockShipForge.shipRecord(DATA, "raven")`
- `DeadlockShipForge.blueprint(DATA, ship)`
- installed component instance condition

It then uses the existing ShipForge generated-art renderer to assemble the actual current component set.

## Upgrade-visible Raven

The following ShipForge slots now directly affect the visible hero ship whenever a compatible part is installed:

- core,
- cockpit,
- wing,
- engine,
- weapon,
- cargo,
- utility.

There is no second visual inventory and no hidden visual tier.

A component bought from the market or recovered as salvage becomes visible because its **same part ID** becomes part of the Raven blueprint.

## Verified example

The QA harness starts with the canonical Raven:

- Twinboom core,
- Armored cockpit,
- Outrigger wing,
- Military engine,
- Apex Rotary weapon,
- Apex Modular cargo,
- Apex Smuggler utility.

It then installs `engine_trident_09`.

Validation confirms:

1. installation succeeds,
2. Raven ShipForge signature changes,
3. the blueprint changes from `engine_military_06` to `engine_trident_09`,
4. the resulting Raven markup contains the Trident engine artwork,
5. the renderer continues using generated component art.

## Paint and condition

The renderer follows the persistent ShipForge palette.

A lightweight presentation band is also derived from the real installed component condition:

- 85–100: operational,
- 65–84: worn,
- 40–64: damaged,
- 0–39: critical.

These are visual treatments only; damage remains owned by ShipForge component instances.

## Where it appears

Because normal `ravenVisual()` calls now route through the live renderer, the change reaches:

- Ship hero presentation,
- Galaxy / hyperspace transit,
- Dogfight Raven HUD,
- other normal Raven hero callouts using `ravenVisual()`.

The holographic schematic intentionally keeps its dedicated schematic asset.

## Fallback

`raven_cutout_v15.svg` remains as a fallback if the live renderer or ShipForge state is unavailable.

This prevents old saves or degraded runtime states from losing Raven presentation.

## Offline support

The v17.13 service worker cache is:

`deadlock-v17-13-raven-live-shipforge`

It includes:

- `runtime/raven-visual.js`
- `runtime/raven-visual.css`

ShipForge's existing install precache already discovers both `visual` and generated `art` paths from every entry in `ship-parts.json`, so the component art used by the Raven remains offline-capable.

## Validation

- live Raven integration: **34 / 34 passed**
- visual-zone specification coverage: **115 / 115 passed**
- source JavaScript syntax checks passed
- engine swap visibly changes rendered part ID
- repaint state follows ShipForge
- static fallback preserved
- offline cache wiring verified

## Fidelity roadmap

This runtime proof immediately fixes the key behavior: **the Raven now changes when its installed hardware changes**.

The next fidelity stage remains the dedicated Raven-specific realistic layer set defined in:

- `RAVEN_MODULAR_VISUAL_SPEC_V17_13.md`
- `raven-visual-zones.json`

Those assets will replace the generalized generated-component assembly zone by zone while preserving exactly the same ShipForge IDs and save data.
