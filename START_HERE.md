# Deadlock v17 — The 3.2 Apex Protocol

Your recovered DnD syndicate canon now lives in the game. Open **Syndicate** in the navigation, or use the command link on HQ, Overview or Factions. Blackglass is your owned asteroid headquarters; Rovan is founder and leader. The name commemorates the successful 3.2-million-credit heist.

Command shows field identity and Jessa’s context-sensitive council briefing. Facilities records the lab, vault, armory, defenses and two Kestrel fighters. People distinguishes members from independent contacts. Treasury keeps personal and syndicate accounts separate. Founding record preserves campaign decisions. See APEX_CANON_V17.md for sources and continuity limits.

By default, new Lower Port jobs are personal. Choose **Represent Apex on future cases** to disclose your affiliation and route those new jobs’ payouts to the reserve. Existing jobs keep their original owner. Withdrawal earns nothing. Residents remember disclosure even if you later operate personally. Repair-crew fees still use your personal field account; transfer funds explicitly when needed.

V16 progress, injuries, personal credits and generated cases are preserved. The Apex reserve initializes once at 1,420,000 credits; new campaigns use 358,400 personal credits. Historical purchases and the heist are not charged or paid again. Your existing campaign, First Flight tutorial and Raven Flight Deck remain available.

## Launch

This is a browser/PWA build. Run `python3 -m http.server 8080` from this folder and open http://localhost:8080, or host the contents of `dist` on your existing HTTPS address. Direct file:// opening cannot load the game data. Offline installation requires a complete first load on HTTPS or localhost. This package is not an Android APK.

Export your old save before changing hosting addresses. Saves belong to their original browser origin; import the JSON to move progress. V15 saves initialize the new district when first visited. No live personal campaign save is bundled.

## Enter the district

1. Open Galaxy, select Veyra Prime and plot a route.
2. Depart, resolve any transit encounter, and continue until arrival.
3. Dock or land, then choose **Enter Lower Port**. The Lower Port navigation page also opens it once you are there.
4. Explore the connected Landing Bay, Freight Market, Rust Lantern cantina, Maintenance Tunnels and Cargo Workshop.
5. Use **Local leads / Current job** and **Connected routes** to jump to the relevant controls on a phone. Expand opens an unobstructed scene viewer; Close or Escape returns to play.

Real galaxy travel consumes fuel and can involve combat. Lower Port exploration has no real-time deadline; you can read and make choices at your own pace.

## How procedural situations work

The district keeps three generated leads available and one active local case. Its six objective families are cargo recovery, contract disputes, courier escorts, infrastructure repair, signal investigation and forged-permit investigation. Clients, targets, clue locations, rewards, dispositions and complications vary.

Evidence, preparations, current leads, the random generator's state and the district's conditions are saved. Opening a menu or reloading does not reroll a situation. New leads avoid recent job families and existing offered families. Current power, supplies and patrol tension influence selection; trusted residents can unlock easier approaches.

Residents remember outcomes and withdrawals. Their replies draw from current conditions, the active job, weather and shared history, excluding their last three responses. The authored library is finite: familiar mechanics or lines can recur later. This release establishes a reusable procedural district system, with room to expand the event and dialogue library.

## Choices and consequences

- Follow a case's location clues and use the available approach buttons. Disabled buttons explain missing preparations.
- Cargo recovery supports negotiation, maintenance access or real combat. Patrol tension can make stealth require more evidence.
- Couriers can use a scouted quiet route, trusted clearance or a confrontation.
- Repairs require a component and an isolated circuit. After isolation, a hired crew can supply the component for 200 credits.
- Signal cases require readings at three distinct named locations. Disputes and permit cases support decisions that favor the district or your own profit.
- Armed approaches launch the existing combat system. Injury persists. Escaping keeps the local case open and quieter approaches available.
- Return to the Landing Bay to collect the stated reward and 40 XP once. Completed cases affect power, supplies, patrol tension and NPC trust.
- **Withdraw from this job** closes an unfinished case with no payment and a one-point loss of client trust. It is remembered.

Repairs brighten the scene and stabilize lighting. Weather, steam and passing traffic provide atmosphere. Pause animations in the Flight Deck or Settings; OS reduced-motion is supported.

## Included

Source, ready-to-host dist, four new environment paintings, exact artwork prompts in ART_V16.md, procedural engine and browser tests, and QA_V16.md. Earlier ship artwork and editable vectors are retained. Previous QA reports are historical, not claims about this release's untested paths.

## Scope

This is a layered 2D browser RPG, with authored assets and rule-based procedural cases. Physical foldable hardware, Android APKs, phone frame rate, other browsers, speech quality and all possible campaign combinations are not certified. The recorded demonstration is silent and uses a controlled seed to show a generated repair case reproducibly.
