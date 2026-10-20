# Deadlock v17.7.0 — Phase 3 Reactive Living World

This Phase 3 increment turns the persistent ambient population from scenery into lightweight, offline-reactive world actors.

## Implemented

- Ambient NPCs remain persistent by scene and now store interaction count, familiarity, mood, last bark and a short local interaction history.
- Background NPCs can be tapped/clicked or focused with the keyboard.
- Interactions generate deterministic local dialogue from role, room and location pools without requiring a network connection.
- Blackglass dialogue recognizes the 3.2 Apex Protocol command context and Deadlock call sign.
- Lower Port uses district-specific ambient dialogue for the landing bay, market, cantina, tunnels and hideout.
- Immediate bark repetition is suppressed.
- Interaction state is written back through the normal campaign save flow.
- Ambient NPCs visually react to weapon fire, hits, ship fire, flybys and narration beats.
- Reaction animation respects reduced-motion and existing performance settings.
- Browser/PWA presentation remains separate from durable JSON state for the planned native/Godot path.

## Compatibility

The living-world schema remains `deadlock.living-world.v1`. Existing v17.5/v17.6 saves are hydrated in place with defaults for the new NPC memory fields.

No ShipForge component IDs, fleet records, Apex canon, procedural case state, credits, injuries or story history are changed.

## Validation

Branch-level validation completed after source/dist synchronization:

- Living-world deterministic + persistence harness: **156/156 passed**.
- App/runtime/offline integration checks: **8/8 passed**.
- Source-to-`dist` parity: **4/4 matched** for app, service worker, living-world runtime and living-world styles.
- `app.js` and `runtime/living-world.js` parsed successfully after modification.

The repository's Node QA scripts were also extended so the normal local test command covers the new interaction-memory behavior on the next full build run.
