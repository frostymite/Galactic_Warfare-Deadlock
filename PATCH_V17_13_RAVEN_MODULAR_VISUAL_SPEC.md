# Deadlock v17.13 — Raven Modular Visual Design Foundation

This design slice prepares the Raven for a realistic modular renderer without changing live gameplay yet.

## Why this exists

The Raven's gameplay state already uses persistent ShipForge components, but normal hero presentation still routes through the static `assets/ships/raven_cutout_v15.svg`. Installing a different engine, weapon, cargo module, cockpit, wing, core, or utility system therefore changes stats without changing the visible flagship.

## Added

- `RAVEN_MODULAR_VISUAL_SPEC_V17_13.md`
- `raven-visual-zones.json`
- `qa/raven-visual-spec.cjs`
- `npm run test:raven-visual-spec`

## Locked architecture

- ShipForge remains the only source of installed hardware truth.
- Raven visuals resolve from `DeadlockShipForge.shipRecord/blueprint`.
- Every installed part maps to a Raven-specific visual zone.
- Current realistic hero target is a fixed 1536×1024 transparent 3/4 composition.
- The Raven follows a 70/30 identity rule: recognizable core identity with visible modular change.
- Damage visuals derive from existing component condition.
- Paint/markings derive from existing ship palette/marking state.
- Legacy Raven SVGs stay available as rollback/fallback assets.

## Coverage

All 36 current light-freighter-compatible parts have machine-readable Raven hero-layer contracts:

- core: 3
- cockpit: 3
- wing: 4
- engine: 6
- weapon: 6
- cargo: 5
- utility: 9

The initial coverage validation passed **115 / 115 checks**.

## Next production step

Generate and approve the realistic Raven anchor identity, then derive the transparent base skeleton and the seven currently installed component-zone layers. Prove those layers can be composited in-browser before producing the remaining compatible hero variants.
