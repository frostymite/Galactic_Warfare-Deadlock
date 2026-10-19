# V17 validation — Apex Protocol foundation

189 assertions passed across four focused suites. No browser page errors in the two browser suites. These tests use disposable campaigns; no live personal save was changed.

| Suite | Passed | Scope |
| --- | ---: | --- |
| Apex state | 32 | Canon migration, separate money, invalid/insufficient transfers, ledger, preserved cases, one-time payouts, withdrawals, council reply continuity |
| Apex browser | 65 | Actual UI transfers, v16 JSON import, actual galaxy travel and completed Apex repair case, exact payout routing, resident disclosure, remote HQ status, four viewport sizes, offline reload/art/state |
| Lower Port browser | 66 | Existing travel, repair/stealth/combat/escape routes, reward persistence, five district places, artwork, responsive viewer and reduced motion |
| Procedural engine | 26 | 100 deterministic worlds; 600 completed cases, 577 distinct generated configurations; all six objective families and alternate routes |

Layout checks cover 320×568, 393×873, 744×460 and 1280×900. A sidebar CSS rule initially affected the new section navigation; the fix explicitly scopes section direction, font size and overflow. Images are awaited before visual assertions. Screenshots were visually reviewed.

The gameplay recording is an actual browser walkthrough of the new command, founding record, facilities, people, treasury, Jessa briefings, HQ and map. It is silent. Its temporary campaign has animations/cinematic transitions disabled for readable captures.

This release adds persistent identity, canon records, treasury and Lower Port affiliation. It does not implement fleet deployment, recruitment, territory control or a complete autonomous crime-syndicate simulation. Original tabletop rules and the archived Rusk operation are not silently substituted for the current game's systems.

Physical Android device performance and native APK packaging were not tested. The finite authored procedural pool can still repeat over long play. Passing tests do not establish that all possible bugs are absent. Prior release QA notes are historical evidence, not a claim that every old suite was rerun for v17.
