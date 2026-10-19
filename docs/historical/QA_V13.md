# Deadlock v13 QA Summary

Final automated regression is generated from the actual v13 runtime with local assets routed into headless Chromium.

Validation focus:

- one living scene / one scene-local HUD on Story, HQ, Galaxy, Ship, Combat and Dogfight
- no global HUD on Overview, Holonet, Settings or Contracts
- all six Raven interior presets
- all five Blackglass HQ room presets
- approved clean Dren asset + actor rig + speaking state
- established clean Rovan asset
- actor interaction/focus behavior
- environmental audio/effects settings + runtime bridge
- cinematic lifecycle
- combat actors tied to live participants and tap-to-target
- rapid page switching without hidden scene/FX/HUD accumulation
- no presentation mutation of credits or contract progress
- PHONE / UNFOLDED / FLEX / alternate-unfolded / PHONE-back overflow regression
- unfolded single-finger `pan-y` main scrolling
- browser console/page errors

See the packaged QA result count in the release notes.

## Final result

**76/76 automated checks passed with 0 browser/page errors.**

The pass also produced current PHONE, UNFOLDED and combat/HQ screenshots for visual review.
