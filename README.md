# Deadlock Tactical OS v10.1 — Forced Encounters

Offline-first solo bounty-hunter RPG/PWA centered on **Rovan Kes / Deadlock**, **The Raven**, and now **Blackglass Station HQ**.

## v10.1 headline changes


- **Danger can now force action:** hostile story complications, failed target recoveries, local ambushes, and hostile travel events can hard-transition into combat.
- Forced ground encounters auto-roll initiative and give enemies real turns that can damage Rovan.
- During a forced encounter, Story/Galaxy navigation is locked until Deadlock wins, escapes, or is forced to retreat.
- Ground combat now uses Rovan's Marksmanship bonus against enemy Defense; misses spend the turn.
- Take Cover reduces the next incoming hit; Break Contact uses Survival against an encounter-specific escape DC.
- Hostile hyperspace encounters can force Dogfight; enemy craft return fire against The Raven after player actions.
- Dogfight escape uses Piloting; victory/escape unlocks the route again.
- Danger bands are now explicit: Low Threat, Active Threat, High Threat, and Combat Imminent.
- Data-driven visual asset registry (`asset-manifest.json`).
- Persistent Blackglass Station HQ with five operational spaces.
- Twelve navigation destinations across a connected route network.
- Real travel loop with route distance, fuel cost, route risk, transit events, arrival, orbit, docking/landing, and local operations.
- Named local sites can launch Story scenes directly.
- Navigation state stays separate from Story canon until the player commits it through play.
- Character/ship/location asset-state hooks for future high-fidelity animation batches.
- Procedural idle motion, HQ scans, star drift, and hyperspace motion.
- Keeps v9.4 Guided Hunt Loop, procedural GM, NPC voices, cinematic orchestral score, consequence layer, Holonet, combat, Raven systems, and Razr Fold layouts.

## Blackglass Station

Blackglass Station in the Kaelor System is Deadlock's home base. The HQ currently contains a Command Lounge, Briefing Room, Rovan's Quarters, Hangar Access, and Contract Board.

## Starter galaxy

The navigation database contains Blackglass Station, Veyra Prime, Drekthar, Nerath, Cindar, Talos, Orivon, Xerra, the Sable Belt, Thalos, Rethis, and Umber. Blackglass HQ is established; other generated world details remain editable gameplay/worldbuilding defaults until established through play.

## Offline

After the PWA caches successfully, the new JSON databases, starter visual library, Story Mode, travel loop, HQ, procedural GM, and score are designed to work without a network connection.

## Android / GitHub Pages

Upload the project at the repository root. Enable GitHub Pages from `main` / `/(root)`, open the Pages URL once online, then install from Chrome. Export campaign JSON before major version changes.

## Important asset policy

High-fidelity existing art in the user's repository is intentionally preserved by the update patch. The new prototype vectors are fallback/state-system assets and do not replace established character canon.
