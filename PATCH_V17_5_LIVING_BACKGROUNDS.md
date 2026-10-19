# Deadlock v17.5.0 — Phase 3 Living Backgrounds Foundation

Phase 3 begins with a persistent ambient-world layer rather than decorative looping silhouettes.

## Implemented
- Persistent ambient NPC identities per location/scene.
- Theme and location-specific roles and behavior pools.
- Articulated walking silhouettes with humanoid, hooded, helmeted, lekku-like, horned and droid forms.
- Walking, carrying, talking, inspecting, patrolling, servicing and idle background behaviors.
- Carryable crates, tool cases, canisters, scanners and tools.
- Multi-depth far/mid/near crowd layers with scale, opacity and ground shadows.
- Ambient scene props including cargo, holo terminals, consoles and service equipment.
- ShipForge traffic integrated into the living-world layer with persistent ship identities.
- Cruise, approach, departure and landing flight patterns.
- Lower Port-specific populations for Landing Bay, Freight Market, cantina, tunnels and salvage hideout.
- Automatic population/traffic reduction for performance mode and mobile layouts.
- Intersection/reduced-motion pausing to avoid spending CPU on invisible or accessibility-disabled animation.
- Offline cache updated for the new runtime.

## Save data
Campaigns gain `livingWorld` using schema `deadlock.living-world.v1`. The state is plain JSON and engine-neutral so the same identities can later be hydrated into Godot NPC/scene resources.
