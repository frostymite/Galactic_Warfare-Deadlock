# Deadlock v17.8.0 — Phase 3 NPC Routines + Ambient Events

This increment advances the Living World from reactive background actors into a lightweight deterministic simulation.

## NPC routines

- Blackglass seeds a persistent crew pool across Command, Briefing, Hangar, Quarters and Contracts.
- Lower Port seeds persistent populations across Landing, Market, Cantina, Tunnels and Hideout.
- Role-specific routes decide where NPCs are currently working:
  - security patrols multiple spaces,
  - mechanics/technicians favor service areas,
  - analysts/officers/brokers rotate between command, briefing and contracts,
  - couriers/runners traverse connected spaces,
  - vendors/patrons remain concentrated around market/cantina areas.
- Scene transitions advance a deterministic world tick.
- Routine activity changes presentation behavior: patrol, service, carry, inspect, talk, walk and idle.
- Persistent identities, familiarity and interaction history from v17.7 remain intact.

## Ambient events

Supported events include:

- Raven service cycles and salvage intake,
- ShipForge-linked arrivals,
- analyst huddles and secure intelligence bursts,
- sealed contract couriers and broker disputes,
- stacked port arrivals and emergency turnarounds,
- market shortages and bulk purchases,
- whispered cantina exchanges,
- tunnel power faults and maintenance anomalies,
- fresh salvage deliveries.

Events are deterministic for the campaign seed and world tick. They persist in `livingWorld.ambientEvents` rather than rerolling on every render.

## Rumor memory

Ambient incidents can create durable rumor records in `livingWorld.rumors`. A rumor records:

- source scene and world tick,
- event ID,
- summary,
- involved ambient NPC IDs,
- linked ShipForge ship ID when relevant,
- status for later story/contract consumption.

This release does not automatically create a paid contract from a rumor yet. It creates the durable bridge needed for a later procedural lead/contract conversion system.

## Compatibility

- Schema remains `deadlock.living-world.v1`.
- Existing v17.5–v17.7 saves hydrate new fields in place.
- No Apex canon, credits, injuries, ShipForge component IDs, fleet ownership, active cases or story history are replaced.
- Browser presentation remains separate from plain JSON state for the planned native/Godot migration.

## Validation

Branch validation after source/dist synchronization:

- Routine/event simulation harness: **34/34 passed** through 120 world ticks.
- Source-to-`dist` parity: **4/4 matched** for app, service worker, living-world runtime and living-world styles.
- Version/offline/QA wiring: **3/3 passed**.
- Verified cross-room visitors, service/patrol/talk routine states, persistent NPC IDs, Lower Port routines, ShipForge-linked events, durable rumors and interaction memory.
