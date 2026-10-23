## ShipForge Catalog Scrub — v17.14.0

ShipForge no longer carries an active path back to the original placeholder component vectors.

The component catalog has been migrated to `deadlock.shipforge.parts.v3` / ShipForge v5. Existing component IDs are intentionally preserved so old saves, installed Raven hardware, salvage, dealers, NPC ships, and fleet records remain compatible.

The active visual contract is now only:

`part.render.asset -> assets/ships/generated/<slot>/<part>.webp`

Removed from the live build:

- legacy `visual` fields,
- legacy `art` / `artVersion` compatibility fields,
- `renderProfile` fallback metadata,
- `ship-component-visuals.json`,
- `runtime/shipforge-visuals.js`,
- all 64 source SVG placeholder components,
- all 64 packaged/dist copies of those placeholders.

The service worker now precaches only `part.render.asset` entries and uses cache `deadlock-v17-14-shipforge-raster-only`.

Validation:
- **177 / 177** runtime/catalog compatibility checks passed,
- all 64 replacement raster parts resolve,
- all six ship classes generate and validate,
- the Raven canonical seven-part loadout remains compatible,
- no active ShipForge component render contains an `assets/ships/components/` path or `ShipForgeVisuals` dependency.


# Deadlock v17 — The 3.2 Apex Protocol

Your recovered DnD syndicate canon now lives in the game. Open **Syndicate** in the navigation, or use the command link on HQ, Overview or Factions. Blackglass is your owned asteroid headquarters; Rovan is founder and leader. The name commemorates the successful 3.2-million-credit heist.

Command shows field identity and Jessa’s context-sensitive council briefing. Facilities records the lab, vault, armory, defenses and two Kestrel fighters. People distinguishes members from independent contacts. Treasury keeps personal and syndicate accounts separate. Founding record preserves campaign decisions. See APEX_CANON_V17.md for sources and continuity limits.

By default, new Lower Port jobs are personal. Choose **Represent Apex on future cases** to disclose your affiliation and route those new jobs’ payouts to the reserve. Existing jobs keep their original owner. Withdrawal earns nothing. Residents remember disclosure even if you later operate personally. Repair-crew fees still use your personal field account; transfer funds explicitly when needed.

V16 progress, injuries, personal credits and generated cases are preserved. The Apex reserve initializes once at 1,420,000 credits; new campaigns use 358,400 personal credits. Historical purchases and the heist are not charged or paid again. Your existing campaign, First Flight tutorial and Raven Flight Deck remain available.


## Raven Modular Visual Foundation — v17.13.1

The Raven now uses a **detailed transparent anchor with Raven-native refit geometry** for normal hero presentation instead of either the old static cutout or generic ShipForge component cards.

`runtime/raven-visual.js` still reads the live Raven record and blueprint from `DeadlockShipForge`, so installed ShipForge IDs remain the only source of truth. When a core, cockpit, wing, engine, weapon, cargo, or utility component differs from the anchor loadout, that slot is redrawn as integrated Raven hardware using the same dark hull, metal edging, wear, cyan emissive language, and condition state as the anchor.

Generic `ShipForge.renderPartSVG()` output is no longer used for Raven refits. The old static Raven cutout remains only as a degraded fallback, while the dedicated holographic schematic remains intentionally separate.

The hotfix covers all **29 alternate compatible refits** across the seven Raven slots. Each alternate part was installed in isolation and verified to produce Raven-native markup with no `shipforge-component` or `sf-generated-art` fallback.

Validation:
- representative engine / weapon / utility refit harness: **16 / 16 passed**
- exhaustive alternate-refit coverage: **116 / 116 passed**
- Raven visual-zone coverage validator: **115 / 115 passed**
- verified v17.13.1 offline cache wiring and static fallback preservation.


## Long-Term NPC Arcs — v17.12.0

Phase 3 now supports persistent personal and relationship story arcs that grow out of the existing NPC agenda system instead of spawning as unrelated random quests. Jessa, Dren Voss, Nera Kade and Renn can each develop multi-stage personal threads tied to the work they have actually been doing.

Personal arcs can create optional side objectives, hidden private concerns, favors, and turning-point decisions. Hidden concerns stay hidden until Deadlock successfully uncovers them. Favors remain requests rather than automatic obligations. When an arc reaches its turning point, background progress freezes until Rovan responds; NPCs cannot resolve their own personal story off-screen.

The relationship web now feeds longer-term relationship arcs. Repeated cooperation can become **Working Trust** or a **Working Alliance**; repeated friction can become a **Fault Line** or an **Open Grudge**. These relationship arcs can enter Story choices, dialogue, or NPC Initiative without overwriting either NPC's personal relationship with Rovan.

The Story panel now shows a compact **Personal Arcs** section with active arcs, stages, visible relationship states, revealed secrets and unresolved favors. Secret content is never displayed before it is revealed.

Arc resolution remains bounded: the system cannot spend credits or Apex reserves, alter payouts, accept/finish contracts, change ship ownership, or make command decisions for Deadlock.

## NPC Agendas + Cross-NPC Reactions — v17.11.0

Phase 3 now gives major NPCs persistent goals that continue moving between direct conversations. Jessa, Dren, Nera Kade and Renn each maintain bounded agenda state with progress, momentum, pressure, recent actions and history.

NPCs can now interact with each other instead of routing every development through Deadlock. Dren can ask Renn to verify escape geometry, Jessa can challenge Dren's raw intel, Nera can pressure Dren for verifiable progress, Renn can warn Dren about bad routes, and Jessa/Nera can scrutinize whether a lead actually changes operational leverage.

A persistent NPC relationship web records cooperation and friction between the major contacts. These relationships are separate from Rovan's personal trust scores: Dren and Nera can irritate each other without silently changing how either character feels about Deadlock.

The Story page includes a **World in Motion** feed showing recent autonomous activity. Meaningful agenda beats can also enter normal procedural Story choices, dialogue, or escalate into NPC Initiative when they are important enough.

Autonomy remains deliberately bounded. NPC agendas cannot spend Rovan's credits, spend the Apex reserve, accept or complete contracts, launch Apex fighters, change ship ownership, collect rewards, or make command decisions for Rovan.

## NPC Initiative — v17.10.0

Phase 3 now lets characters act without waiting for Deadlock to click a dialogue option. The Story Director can generate unsolicited, persistent initiative beats from established contacts, Blackglass crew conditions, ambient living-world NPCs, and older player decisions.

Examples include Jessa interrupting over a deteriorating Raven system, Dren calling because he independently worked a lead, Renn warning about rising operational pressure, Nera requesting a contract status update, or an ambient mechanic approaching Deadlock because they were involved in a live rumor.

NPC initiative uses the existing Story interruption layer rather than a separate minigame. Each initiative offers up to four contextual responses, preserves the current mission menu underneath it, and can feed rumor verification, relationship dialogue, investigation, or ship repair.

Initiative is intentionally throttled. It cannot spawn while another interruption is already pending, cannot fire twice on the same story turn, and receives a deterministic multi-turn cooldown after firing. Recent initiative kinds and contacts are also remembered to reduce repetitive interruptions.

Older player decisions can return later through NPC memory initiative. Only recorded player actions qualify, so system-generated events do not pretend to be choices Deadlock made.

## Procedural Story Director — v17.9.0

Phase 3 now replaces the fixed Story choice loop with an offline procedural director. Mission menus are rebuilt from the active contract stage, target, current NPC, location, recent player choices, latest consequences, Raven condition, living-world rumors and promoted leads. Recently shown options are remembered so the next decision does not simply redraw the same four choices.

Dialogue follow-ups are procedural as well. NPC conversations use the existing personality, mood and relationship memory systems, but repeated factual answers are now detected and rotated into a current update instead of repeating the exact same line. Live rumors and procedural leads can enter conversations naturally.

Living-world rumors can be worked directly from Story. A successful investigation promotes the rumor into a persistent procedural lead while preserving its source location, ambient NPC IDs and linked ShipForge ship ID. Failed verification keeps an uncertain lead instead of deleting the thread.

Narration now reacts to the selected approach and outcome. Investigation, deception, field action, rumor work and failed checks produce different evolving story beats rather than repeatedly restating the current objective.

## NPC Routines + Ambient Events — v17.8.0

Phase 3 now simulates lightweight daily movement instead of leaving ambient NPCs permanently attached to one backdrop. Blackglass crew receive deterministic duty routes through Command, Briefing, Hangar, Quarters and Contracts; Lower Port workers, couriers, security, vendors and salvagers rotate through role-appropriate district spaces. Mechanics visibly switch into service work, security patrols, couriers carry freight, and analysts/brokers gather around briefing and contract areas.

Scene transitions advance an offline world tick. That tick can generate persistent ambient incidents such as ShipForge-linked arrivals, Raven maintenance cycles, salvage intake, broker disputes, power faults and whispered exchanges. Incidents can create persistent rumor records with involved NPCs and ship IDs so later story/contract systems can consume them without rerolling the event.

## Reactive Living World — v17.7.0

Phase 3 now moves beyond ambient motion. Background NPCs are persistent interactable identities: tap/click a passerby to get a locally generated, context-aware bark, and the same NPC remembers interaction count, familiarity and recent lines in the campaign save. Blackglass crew use Apex/HQ-aware dialogue while Lower Port populations use district-specific talk pools.

Ambient crowds also react visually to combat fire, impacts, flybys and narration without becoming scripted combatants. The feature remains offline-first and engine-neutral; durable NPC memory stays plain JSON while the browser renderer owns animation and presentation.

## Visual Hotfix + Generated ShipForge — v17.6.0

The Galaxy navigation screen has been stabilized so normal map browsing no longer competes with a second living-scene layer. Blackglass HQ now uses distinct generated environment images for Command, Briefing, Hangar, Quarters and Contracts instead of the shared placeholder-style location art.

ShipForge v4 keeps all 64 existing part IDs and compatibility rules but adds transparent generated artwork for every component. The generated parts are normalized to the same modular assembly canvas, so deterministic traffic, NPC ships, dealer stock and owned ships can use the more physical rendered presentation without changing save data. The SVG versions remain as fallbacks. See `PATCH_V17_6_GENERATED_SHIPFORGE_VISUAL_HOTFIX.md` and `SHIPFORGE_GENERATED_ART_V17_6.md`.

## ShipForge Phase 2 — v17.4.0

ShipForge is now a gameplay system rather than only a procedural visual generator. Open **Ship** to use the new Shipyard, where the Raven and future owned craft keep exact component instances, paint, ownership, condition, damage and derived performance in the campaign save. Components can be purchased from local exchanges or salvage yards, installed or replaced according to ship-class/mount compatibility, repaired, removed when optional, sold, or recovered from defeated modular ships.

Hull-penetrating space-combat damage can degrade installed components. Hull capacity, shields, fuel, attack, evasion, weapon damage, cargo capability, speed and value are recalculated from the installed parts and their current condition. Persistent NPCs and repeated encounter sources keep their generated ships and accumulated damage between encounters. General scene traffic and Lower Port flybys also use save-persistent ShipForge builds instead of rerolling generic craft.

The durable ShipForge state is plain JSON (`deadlock.shipforge.world.v1` / `deadlock.shipforge.persistent-ship.v1`) and references component IDs rather than browser-only objects, preserving the planned native/Godot handoff. See `SHIPFORGE_PHASE2_V17_4.md` for the schema and system details.

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
