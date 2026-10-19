# Deadlock v15 — verification report

467 assertions passed across eight browser suites, with zero uncaught browser errors in the tested flows. These are assertions, not 467 distinct playthroughs. The separate recorded playthrough also completed without browser errors.

| Suite | Passed |
|---|---:|
| layouts | 227 |
| offline | 39 |
| combat | 9 |
| rooms | 37 |
| world | 43 |
| story | 26 |
| engagement | 75 |
| migration | 11 |

## What was exercised

- First Flight peaceful and combat paths, mid-mission reload, persistent damage, payout and duplicate-payout protection.
- 24 pages across phone, unfolded, short-landscape and desktop sizes; expanded viewer proportions and cleanup.
- Offline cache contents, artwork decoding, export/import, live resize and scene cleanup.
- Existing HQ and Raven rooms, original Story interactions, Veyra districts, purchases and escape behavior.
- Engine preview does not consume fuel or credits; effect completes and controls become usable again.
- Flight tabs remain horizontal; new views fit 320, 393, 744 and 1280 pixel-wide viewports.
- Scans cancel when navigating away, record once, preserve gameplay resources and work offline.
- Known signatures open readable records; archive and appearance choices survive reload.
- Amber cosmetic unlocks after three discoveries; violet becomes available after the introductory contract.
- Real ship system conditions appear in diagnostics. Local scans are blocked during transit.
- Reduced-motion and manually paused animations remain usable.
- v14-shaped saves import with their credits, fuel and mission checkpoint intact; missing new state initializes safely.
- New archive data survives an actual export/import roundtrip.

## Visual review and corrections

Reviewed the home screen, ship stage, full-screen viewer, system diagram, signal cards, archive and phone view. Fixed inherited sidebar styles affecting the new tab layout and hid duplicate viewer controls. The ship uses a transparent RGBA asset with object-fit containment. The SVGs remain editable and scale without raster stretching. Phone content scrolls vertically; bottom navigation is fixed and scrolls horizontally. Full-page screenshots capture that fixed navigation at the viewport boundary.

## Run the suites

From the release root, install Playwright and Chromium in your test environment. Run the eight scripts in `qa` sequentially with Node, for example `node qa/engagement.cjs`. A custom browser can be selected with CHROMIUM_EXECUTABLE_PATH. Each script starts its own local HTTP server and writes results in qa; some also write temporary screenshots or export fixtures. No user's live browser save is used.

## Limits

Headless Chromium testing and simulated viewport sizes do not certify physical Razr Fold hardware, native Android builds, frame rate on a phone, other browser engines or speech/audio quality. Specific fixtures and deterministic randomness exercise selected branches. This is evidence for these release flows, not a promise of zero possible bugs. New ship animations are layered 2D artwork and CSS, not a 3D simulation. The accompanying 106-second gameplay video is silent.
