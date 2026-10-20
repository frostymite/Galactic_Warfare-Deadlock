# Deadlock v17.11.0 — NPC Agendas + Cross-NPC Reactions

This Phase 3 increment makes established characters continue pursuing bounded goals between direct player interactions.

## Persistent agendas

The new `runtime/npc-agendas.js` module stores plain JSON state under `story.npcAgendas`.

Major actors currently tracked:

- Jessa — technical reliability and intelligence validation,
- Dren Voss — field leverage, rival-hunter awareness and trail quality,
- Nera Kade — contract outcomes, timelines and verified progress,
- Renn — routes, exits and survivability.

Each actor retains:

- agenda progress,
- momentum,
- pressure,
- last action,
- recent action kinds,
- bounded activity history.

## Cross-NPC relationship web

The agenda engine maintains separate NPC-to-NPC relationship edges for:

- Jessa ↔ Dren,
- Jessa ↔ Nera,
- Jessa ↔ Renn,
- Dren ↔ Nera,
- Dren ↔ Renn,
- Nera ↔ Renn.

Cooperative activity can improve the edge score and reduce tension. Friction can increase tension or reduce cooperation.

These relationships do **not** overwrite Rovan's personal trust/reputation values.

## Autonomous examples

The engine can produce activity such as:

- Jessa auditing a deteriorating Raven subsystem,
- Jessa demanding raw timestamps before trusting Dren's lead,
- Dren asking Renn to verify escape geometry,
- Dren pushing back on Nera's preferred timing,
- Nera asking Jessa whether a lead actually changes operational leverage,
- Renn cross-checking routes and contingencies,
- background rumor/source verification.

## Story integration

Recent meaningful agenda activity can now:

- appear in the **World in Motion** Story panel,
- become a normal procedural Story option,
- enter dialogue with the involved NPC,
- become contextual dialogue material,
- escalate into NPC Initiative if attention is high enough.

The Story menu searches recent activity for the latest **relevant** agenda beat rather than blindly using the newest low-importance action.

Specialized dialogue, ship, and interruption menus are preserved when agenda advancement happens; background simulation does not overwrite the player's current interaction flow.

## Safety boundaries

NPC autonomy cannot directly:

- spend personal credits,
- spend the Apex reserve,
- accept contracts,
- complete contracts,
- change contract payouts,
- collect rewards or XP,
- launch Apex assets,
- change ship ownership,
- make command decisions for Rovan.

Agenda activity may add references to existing rumors/leads and change only its own agenda/relationship state unless the player later responds through normal gameplay.

## Offline / portability

The engine is fully offline and persists as plain JSON. It is loaded before the Story Director and cached by the v17.11 service worker.

## Validation

Source/integration validation covered:

- all four major NPCs acting,
- autonomous cross-NPC interactions,
- cooperation and friction,
- NPC relationship drift,
- bounded activity and relationship history,
- rumor and lead references,
- high-attention agenda events,
- agenda activity entering mission choices,
- agenda activity entering dialogue,
- NPC Initiative compatibility,
- protected player/Apex/contract/ship state remaining unchanged,
- deterministic replay,
- Story specialized-choice preservation,
- offline module load/cache wiring.

The large combined source harness passed after the relevance fix, including the protected-state assertions.
