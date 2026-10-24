# Legacy migration
Deadlock Legacy remains read-only reference material during the Unreal rebuild.
Migration is schema-based, not DOM/UI based. Import campaign facts and identifiers; never import Legacy presentation coordinates or CSS assumptions.
Initial importer accepts player identity, Raven identity and faction HQ. Subsequent UE-0/UE-1 migrations will add credits, component inventory/loadout, discovered locations, contracts, story flags and NPC memory after their Unreal schemas are finalized.
Unknown fields are ignored so older migration snapshots remain forward-tolerant.
