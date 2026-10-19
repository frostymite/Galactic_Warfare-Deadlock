# Deadlock v16 verification

455 named assertions passed across eight suites. The pure procedural-engine suite additionally completed 600 generated cases in 100 seeded worlds, producing 577 distinct case configurations (family, locations, client, reward and title). No uncaught browser errors were observed in the tested browser flows.

| Suite | Passed |
|---|---:|
| layouts | 235 |
| offline | 39 |
| combat | 9 |
| rooms | 37 |
| story | 26 |
| port | 66 |
| port-offline | 17 |
| engine | 26 |

## Procedural correctness

Checked seed determinism, three distinct offered families, repeat avoidance, all six objective families, solvability and single payment across 600 generated cases. Exercised stealth, simulated combat outcomes, selfish resolutions, paid repairs, insufficient funds, withdrawals, trusted clearance, persistent NPC memories, recent-dialogue exclusion and RNG continuity after serialization. Simulated combat outcomes in this suite test the district state machine; actual combat is covered separately in Chromium.

## Browser playtests

Travelled through the real Galaxy UI to Veyra Prime and entered the district. Played repair and stealth cases, a live combat victory with reload, and an escape followed by a peaceful courier delivery. Checked exact payout and no repeat reward, generated-state stability across navigation and reload, all five scene assets, expanded-view proportions, and 320/393/744/1280-wide layouts. The final phone layout prioritizes an active job and offers jump controls for work and routes.

Verified new assets are precached, offline case progress, exact export/import of the active situation and generator state, offline case completion, resident memory after withdrawal, and no payment on withdrawal. Original First Flight, forced combat recovery, Story, HQ/ship rooms and general page-layout suites also passed. V15-only features retain their implementation; only the flows listed here were revalidated for v16.

A viewer fix now restores original inline styles when closing: expanded district scenes retain their world-lighting value, and ship engine-color styling is preserved by the same mechanism. Original source and dist are compared during packaging.

## Reproduce

From the release root run `node qa/engine.cjs` for the pure generator checks. Browser suites require Playwright and an installed Chromium: run the other seven scripts in qa sequentially. Set CHROMIUM_EXECUTABLE_PATH for a custom executable. Each script starts a local server and writes result JSON; some produce screenshots and temporary export fixtures. All sessions are isolated from the user's live campaign.

## Limits

Assertions are not counts of unique playthroughs. Tests use controlled fixtures and randomness for reproducibility. Physical Razr Fold behavior, native Android packaging, phone frame rate, speech/audio quality, all browser engines and exhaustive campaign state combinations remain unverified. This does not guarantee zero bugs. Screenshots and the silent recording show actual browser play; the recording uses a controlled district seed.
