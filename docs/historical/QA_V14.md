# Deadlock v14 verification

Release scope: First Flight mission, cinematic viewer, Veyra exploration, local services and browser polish. This is a playable prototype milestone; the full concept-board galaxy remains further production work.

## Completed checks

| Suite | Passed | Coverage |
|---|---:|---|
| Layouts and peaceful mission | 219 | 23 pages at four viewport sizes; five viewer sizes; reload, payment and duplicate-payment protection |
| Offline and persistence | 39 | Service worker, five scene plates, offline reload, export/import, resize and live-scene cleanup |
| Combat and corrupt-save recovery | 9 | Forced combat, reload, victory, persistent damage, payment and malformed JSON recovery |
| HQ, Raven and motion | 37 | Five HQ rooms, six ship rooms, map nodes and reduced-motion behavior |
| World exploration and economy | 43 | Five Veyra districts, saved visits, objective continuity, quoted prices, insufficient funds and escaping combat |
| Original Story and save errors | 26 | Ten Story interactions, bounty dismissal, invalid import rejection and visible storage-failure handling |

373 checks passed across six suites. Capture playback is additionally checked separately. These are assertions, not 373 distinct gameplay scenarios. No uncaught browser errors were observed in these tested flows. Automated sessions use fresh isolated browser storage; deterministic random values and economy fixtures are used where needed to exercise specific branches reproducibly.

## Visual review

Reviewed captured desktop/unfolded and phone scenes, combat controls and cinematic viewer. Corrected a foldable-layout rule that constrained the full-screen viewer. Checked image proportions, text readability, overflow, closing the viewer, and restoring the original scene. Phone pages scroll vertically and navigation scrolls horizontally by design.

## Reproducing tests

From the release root, install Playwright in your test environment and its Chromium browser. Run `node qa/layouts.cjs`, `node qa/offline.cjs`, `node qa/combat.cjs`, `node qa/rooms.cjs`, `node qa/world.cjs`, and `node qa/story.cjs` sequentially. Set CHROMIUM_EXECUTABLE_PATH if using a custom browser. Each script starts its own local HTTP server and writes result JSON in qa. Test runs may also write temporary screenshots and export fixtures there. Included result files record this release's runs.

## Limits

Tests used headless Chromium with simulated viewport sizes, not physical folding hardware. Real-device performance, native Android packaging, other browsers, sound/speech quality, exhaustive procedural campaign branches and every possible imported save are not certified. The recording is silent. This evidence supports the tested release flows, not a guarantee of zero bugs.
