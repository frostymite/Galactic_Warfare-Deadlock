# Deadlock v9.4 — Guided Hunt Loop QA

## Result
PASS — no JavaScript page errors in guided mission tests.

## Gameplay clarity
- Default Marr state renders as Stage 2/6: BUILD THE TRAIL at 35% Trail Confidence.
- UI explains what Trail Confidence means and identifies the next unlock.
- Each choice shows a gameplay purpose and expected consequence type.
- Contracts page no longer exposes +10% as the primary gameplay interaction.

## Mission phase thresholds
- 49%: BUILD THE TRAIL
- 50%: TRAIL NARROWED
- 75%: SEARCH WINDOW
- 90%: TARGET LOCATED with capture-resolution choices
- 100%: TARGET SECURED with TURN IN available

## End-to-end Marr test
- Successful target-resolution choice at 90% -> Marr progress 100%.
- Marr status -> Secured Alive.
- Turn-in closes Recover Marr, pays 70,000 CR gross, and advances guidance to the next active job.
- Planned Dren payout split remains an unresolved loose end; no split percentage is invented.

## Generic contract test
- Non-target contracts such as Nera Kade Bounty receive operation stages.
- At 90%, final-resolution choices are available.
- Successful resolution -> 100% / TERMS SATISFIED -> turn-in available.

## Choice consequence test
- Natural 20 Investigation from Marr 35% advanced Trail Confidence to 50%, changed phase to TRAIL NARROWED, updated objective, and replaced choices with phase-specific options.
- Failed Investigation at 35% did not fake progress; Trail Confidence remained 35% and danger increased.

## Fold / viewport regression
- 393x873 PHONE: 0 px horizontal overflow.
- 744x828 UNFOLDED: 0 px horizontal overflow; main vertical scroller remains `overflow-y:auto`.
- 744x460 FLEX: 0 px horizontal overflow.
- 828x744 UNFOLDED: 0 px horizontal overflow.
- Fold back to 393x873 PHONE: 0 px horizontal overflow.
- Existing unfolded `touch-action: pan-y` / momentum-scrolling rules remain in place.

## Static checks
- `node --check app.js`: PASS
- `character-data.json`: valid JSON
- Service-worker cache bumped to `deadlock-v9-4-guided-hunt-loop-cache-1`
