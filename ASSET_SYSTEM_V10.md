# Deadlock v10 — Asset System Foundation

v10 moves visual references out of hard-coded UI mockups and into `asset-manifest.json`.

## Rules

- Scene art never contains tabs, buttons, meters, or other UI controls.
- Established character art wins over prototype state art. Missing assets fall back instead of breaking a scene.
- Character assets are addressable by character + state (`neutral`, `talking`, `suspicious`, `angry`, `focused`, `injured`, `holo`).
- Ship assets are addressable by context (`flight`, `orbit`, `landed`, `schematic`).
- Location art is addressable independently of campaign state.
- CSS/WebAudio effects remain procedural where that saves storage: breathing, holo shimmer, scan lines, star drift, hyperspace motion, orchestral score.

## Current starter library

- Character-state prototype vectors for Rovan, Dren, Nera Kade, Renn, Jessa, and unknown contacts.
- Blackglass Station exterior plus five HQ interiors.
- The Raven flight/orbit/landed/schematic variants.
- Eleven planet/location hero vectors.
- Starfield and hyperspace effect assets.
- Two generated concept boards in `docs/` used only as visual design references.

Prototype vectors are explicitly placeholders. They do not redefine character appearance canon. Dren's existing user-approved portrait and Rovan's established portrait remain preferred when present in the user's repository.

## Next asset expansion

The manifest is ready for higher-fidelity replacements without rewriting gameplay code. Future batches can add facial expressions, full-body conversation poses, scene foreground layers, animated overlays, location interiors, weather variants, landing shots, and encounter art.
