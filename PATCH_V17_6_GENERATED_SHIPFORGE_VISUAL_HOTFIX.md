# Deadlock v17.6.0 — Generated ShipForge + Visual Hotfix

This cumulative patch builds on the current v17.4.0 GitHub baseline and includes the v17.5 Living Backgrounds foundation plus the v17.6 visual correction/art pass.

## Galaxy visual hotfix

- Normal Galaxy-map browsing no longer injects a second full living-scene layer above the map. The cinematic Galaxy scene remains active only during orbit and hyperspace transit.
- The map now uses stricter paint/layout containment and stable z-ordering for stars, routes, nodes and legend.
- Fold/unfolded layout rules were tightened to prevent cross-column overflow and node/label bleed.
- Mobile map labels and dossier sizing were reduced slightly for cleaner narrow-screen rendering.

## Blackglass HQ art

The five Blackglass spaces now have unique generated environment images rather than sharing the old blue placeholder-style location art:

- Command Lounge
- Briefing Room
- Hangar Access
- Rovan's Quarters
- Contract Board

Selecting an HQ space also feeds its generated image into the living-scene renderer. The common holographic table is now limited to the Command, Briefing and Contracts rooms instead of appearing in Hangar and Quarters.

## ShipForge generated component art

All 64 existing component IDs now have transparent generated artwork in addition to their existing SVG fallback. No component IDs, compatibility rules, mounts, prices, manufacturers or persistent ship records were replaced.

The generated art is normalized to one common ShipForge canvas so the same parts can still be layered into deterministic assembled craft. The old SVG geometry remains available as a fallback/data-safe representation.

Runtime changes:

- ShipForge renderer version 4.0.0.
- `presentation: generated-art-three-quarter`.
- Generated WebP component art is used in component cards and assembled ships.
- Engine/weapon/utility generated-art groups keep light presentation motion.
- Performance and reduced-motion modes disable the extra generated-art animations.
- Service worker dynamically precaches both each component's `visual` SVG and its generated `art` asset.

## Offline / native path

The browser/PWA build remains fully offline-first. Generated art is only a presentation asset; persistent ship state still stores IDs and component instances, preserving the planned Godot/native handoff.

## QA

- ShipForge deterministic/component suite: 8,503 checks passed.
- Phase 2 world suite: 39/39 passed.
- Phase 2 integration suite: 20/20 passed after updating v17.6 version/cache expectations.
- Living Backgrounds suite: 153/153 passed.
- New visual-hotfix/generated-art suite: 15/15 passed.
- JavaScript syntax checks passed for the modified runtime/application files.
