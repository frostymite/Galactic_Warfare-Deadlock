# Deadlock v17.4.0 — ShipForge Phase 2 Complete

This patch is intended for Deadlock v17.3.0+.

Adds the complete Phase 2 ShipForge gameplay layer: persistent player/NPC ships, component instances and condition, component-derived ship/combat stats, damage and repair, dealer and salvage economies, Raven/future-owned-ship installation management, persistent encounter ships, persistent world traffic, salvage recovery, and offline caching.

The patch deliberately does **not** replace `assets/ships/raven_cutout_v15.svg`; the v17.2.1 true-vector Raven remains the canonical Raven flight asset.

Save state remains JSON-compatible. Existing campaigns initialize the Raven ShipForge record during migration and preserve the prior Raven's current hull/shield/fuel percentages when modular maximums are calculated.
