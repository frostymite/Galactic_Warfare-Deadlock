# Deadlock v17.2.1 — Raven True Vector Fix

- Replaces the Raven flight artwork with a true SVG vector composed entirely of SVG paths/shapes.
- Removes the raster image wrapper that could carry an opaque black rectangle.
- Flight Deck, Dogfight, Engagement and cinematic views now reference the SVG directly.
- Updates the offline service-worker cache key so existing installs refresh the corrected asset.
- No save-game, campaign, mission, ShipForge, or Apex state changes.
